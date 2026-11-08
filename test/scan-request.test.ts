import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reserveDailyScan } from "@/lib/quota.server";
import { takeScanLease } from "@/lib/scan-lease.server";
import { requestScan } from "@/lib/scan-request.server";
import { runScan } from "@/lib/scan.server";
import { loadScan } from "@/lib/store.server";
import type { AnalysisResult } from "@/lib/types";

vi.mock("cloudflare:workers", () => ({
  env: { SCAN_LIMITER: { limit: vi.fn() } },
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeader: () => "8.8.8.8",
}));
vi.mock("@/lib/quota.server", () => ({ reserveDailyScan: vi.fn() }));
vi.mock("@/lib/scan-lease.server", () => ({ takeScanLease: vi.fn() }));
vi.mock("@/lib/render", () => ({
  BrowserUnavailableError: class extends Error {},
}));
vi.mock("@/lib/scan.server", () => ({ runScan: vi.fn() }));
vi.mock("@/lib/store.server", () => ({ loadScan: vi.fn() }));

const RESULT = { slug: "example.com" } as AnalysisResult;
const SLUG = "example.com";

const releaseLease = vi.fn(() => Promise.resolve());
const releaseQuota = vi.fn(() => Promise.resolve());
const limit = vi.mocked(env.SCAN_LIMITER.limit);

beforeEach(() => {
  vi.stubEnv("DEV", false);
  vi.clearAllMocks();
  vi.mocked(loadScan).mockResolvedValue(null);
  vi.mocked(takeScanLease).mockResolvedValue({ release: releaseLease });
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

describe("requestScan", () => {
  it("serves a stored report without a lease or quota", async () => {
    vi.mocked(loadScan).mockResolvedValue(RESULT);
    await expect(requestScan(SLUG)).resolves.toEqual({
      ok: true,
      result: RESULT,
    });
    expect(takeScanLease).not.toHaveBeenCalled();
    expect(reserveDailyScan).not.toHaveBeenCalled();
  });

  it("keeps the charge and frees the lease after a result", async () => {
    await expect(requestScan(SLUG)).resolves.toEqual({
      ok: true,
      result: RESULT,
    });
    expect(releaseQuota).not.toHaveBeenCalled();
    expect(releaseLease).toHaveBeenCalledOnce();
  });

  it("charges nothing while the lease is held, even for Score again", async () => {
    vi.mocked(takeScanLease).mockResolvedValue(null);
    await expect(requestScan(SLUG, { fresh: true })).resolves.toEqual({
      ok: false,
      error:
        "This page is being scored right now. Reload in a minute to see its report.",
    });
    expect(limit).not.toHaveBeenCalled();
    expect(reserveDailyScan).not.toHaveBeenCalled();
    expect(runScan).not.toHaveBeenCalled();
  });

  it("gives the reservation back and frees the lease when the scan throws", async () => {
    vi.mocked(runScan).mockRejectedValue(new Error("The site answered 403."));
    const outcome = await requestScan(SLUG);
    expect(outcome).toEqual({ ok: false, error: "The site answered 403." });
    expect(releaseQuota).toHaveBeenCalledOnce();
    expect(releaseLease).toHaveBeenCalledOnce();
  });

  it("frees the lease when the per-minute limit refuses", async () => {
    limit.mockResolvedValue({ success: false });
    const outcome = await requestScan(SLUG);
    expect(outcome.ok).toBe(false);
    expect(reserveDailyScan).not.toHaveBeenCalled();
    expect(runScan).not.toHaveBeenCalled();
    expect(releaseLease).toHaveBeenCalledOnce();
  });

  it.each(["client", "site"] as const)(
    "frees the lease when the %s quota refuses, in the product's words",
    async (refusedBy) => {
      vi.mocked(reserveDailyScan).mockResolvedValue({ ok: false, refusedBy });
      const outcome = await requestScan(SLUG);
      expect(outcome).toMatchObject({
        ok: false,
        error: expect.not.stringMatching(/scan/iu),
      });
      expect(runScan).not.toHaveBeenCalled();
      expect(releaseLease).toHaveBeenCalledOnce();
    }
  );

  it("still takes the lease in dev, without any quota", async () => {
    vi.stubEnv("DEV", true);
    await requestScan(SLUG);
    expect(takeScanLease).toHaveBeenCalledWith(SLUG);
    expect(limit).not.toHaveBeenCalled();
    expect(reserveDailyScan).not.toHaveBeenCalled();
  });
});
