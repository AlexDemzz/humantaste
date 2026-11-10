import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reserveDailyScan } from "@/lib/quota.server";
import { attemptScan, requestScan } from "@/lib/scan-request.server";
import { runScan } from "@/lib/scan.server";
import { loadScan } from "@/lib/store.server";
import type { AnalysisResult } from "@/lib/types";

vi.mock("cloudflare:workers", () => ({
  env: {
    SCAN_LIMITER: { limit: vi.fn() },
    SITE_SCAN: { getByName: vi.fn() },
  },
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeader: () => "8.8.8.8",
}));
vi.mock("@/lib/quota.server", () => ({ reserveDailyScan: vi.fn() }));
vi.mock("@/lib/render", () => ({
  BrowserUnavailableError: class extends Error {},
}));
vi.mock("@/lib/scan.server", () => ({ runScan: vi.fn() }));
vi.mock("@/lib/store.server", () => ({ loadScan: vi.fn() }));

const RESULT = { slug: "example.com" } as AnalysisResult;
const SLUG = "example.com";
const TARGET = { slug: SLUG, url: "https://example.com/", host: SLUG };
const REQUEST = { target: TARGET, fresh: false, ip: "8.8.8.8" };

const releaseQuota = vi.fn(() => Promise.resolve());
const limit = vi.mocked(env.SCAN_LIMITER.limit);
const getByName = vi.mocked(env.SITE_SCAN.getByName);

beforeEach(() => {
  vi.stubEnv("DEV", false);
  vi.clearAllMocks();
  vi.mocked(loadScan).mockResolvedValue(null);
  limit.mockResolvedValue({ success: true });
  vi.mocked(reserveDailyScan).mockResolvedValue({
    ok: true,
    release: releaseQuota,
  });
  vi.mocked(runScan).mockResolvedValue(RESULT);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("attemptScan", () => {
  it("serves a stored report without any quota", async () => {
    vi.mocked(loadScan).mockResolvedValue(RESULT);
    await expect(attemptScan(REQUEST)).resolves.toEqual({
      ok: true,
      result: RESULT,
    });
    expect(reserveDailyScan).not.toHaveBeenCalled();
    expect(runScan).not.toHaveBeenCalled();
  });

  it("scores again when a fresh scan is asked for, past the stored report", async () => {
    vi.mocked(loadScan).mockResolvedValue({
      slug: "stale",
    } as AnalysisResult);
    await expect(attemptScan({ ...REQUEST, fresh: true })).resolves.toEqual({
      ok: true,
      result: RESULT,
    });
    expect(runScan).toHaveBeenCalledWith(TARGET);
  });

  it("keeps the charge after a result", async () => {
    await expect(attemptScan(REQUEST)).resolves.toEqual({
      ok: true,
      result: RESULT,
    });
    expect(releaseQuota).not.toHaveBeenCalled();
  });

  it("gives the reservation back when the scan throws", async () => {
    vi.mocked(runScan).mockRejectedValue(new Error("The site answered 403."));
    const outcome = await attemptScan(REQUEST);
    expect(outcome).toEqual({ ok: false, error: "The site answered 403." });
    expect(releaseQuota).toHaveBeenCalledOnce();
  });

  it("refuses this visitor when the per-minute limit says no", async () => {
    limit.mockResolvedValue({ success: false });
    const outcome = await attemptScan(REQUEST);
    expect(outcome).toMatchObject({ ok: false, refused: true });
    expect(reserveDailyScan).not.toHaveBeenCalled();
    expect(runScan).not.toHaveBeenCalled();
  });

  it.each(["client", "site"] as const)(
    "refuses this visitor when the %s quota says no, in the product's words",
    async (refusedBy) => {
      vi.mocked(reserveDailyScan).mockResolvedValue({ ok: false, refusedBy });
      const outcome = await attemptScan(REQUEST);
      expect(outcome).toMatchObject({
        ok: false,
        refused: true,
        error: expect.not.stringMatching(/scan/iu),
      });
      expect(runScan).not.toHaveBeenCalled();
    }
  );

  it("skips every quota in dev", async () => {
    vi.stubEnv("DEV", true);
    await attemptScan(REQUEST);
    expect(limit).not.toHaveBeenCalled();
    expect(reserveDailyScan).not.toHaveBeenCalled();
    expect(runScan).toHaveBeenCalledOnce();
  });
});

describe("requestScan", () => {
  const scan = vi.fn();

  beforeEach(() => {
    getByName.mockReturnValue({ scan } as unknown as ReturnType<
      typeof env.SITE_SCAN.getByName
    >);
  });

  it("asks the object of that site, on behalf of this visitor", async () => {
    scan.mockResolvedValue({ ok: true, result: RESULT });
    await requestScan(SLUG, { fresh: true });
    expect(getByName).toHaveBeenCalledWith(SLUG);
    expect(scan).toHaveBeenCalledWith({
      target: expect.objectContaining({ slug: SLUG }),
      fresh: true,
      ip: "8.8.8.8",
    });
  });

  it("answers from a stored report without waiting on a rescan in progress", async () => {
    vi.mocked(loadScan).mockResolvedValue(RESULT);
    await expect(requestScan(SLUG)).resolves.toEqual({
      ok: true,
      result: RESULT,
    });
    expect(getByName).not.toHaveBeenCalled();
  });

  it("says the scan was interrupted, not that the address is wrong, when the object drops", async () => {
    scan.mockRejectedValue(new Error("Durable Object reset"));
    const outcome = await requestScan(SLUG);
    expect(outcome).toMatchObject({
      ok: false,
      error: expect.stringMatching(/interrupted.*try again/iu),
    });
    expect(outcome).not.toMatchObject({
      error: expect.stringMatching(/address/iu),
    });
  });

  it("gives no score when the page could not be rendered, and says to try again", async () => {
    scan.mockResolvedValue({
      ok: true,
      result: { ...RESULT, score: 100, rendered: false, degraded: true },
    });
    const outcome = await requestScan(SLUG);
    expect(outcome).toMatchObject({
      ok: false,
      error: expect.stringMatching(/no score.*try again/iu),
    });
    expect(outcome).not.toHaveProperty("result");
  });

  it("keeps a rendered scan whose visual read failed", async () => {
    const result = { ...RESULT, rendered: true, degraded: true };
    scan.mockResolvedValue({ ok: true, result });
    await expect(requestScan(SLUG)).resolves.toEqual({ ok: true, result });
  });

  it("answers a bad address without waking any object", async () => {
    await expect(requestScan("not a url")).resolves.toMatchObject({
      ok: false,
    });
    expect(getByName).not.toHaveBeenCalled();
  });
});
