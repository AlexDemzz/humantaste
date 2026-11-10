import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchPage, SiteRefusedError } from "@/lib/fetch-page";
import type { FetchedPage } from "@/lib/fetch-page";
import { visualRead } from "@/lib/judge.server";
import { BrowserUnavailableError, renderPage } from "@/lib/render";
import type { RenderOutput } from "@/lib/render";
import { runScan } from "@/lib/scan.server";
import { saveScan } from "@/lib/store.server";
import type { Target } from "@/lib/target";
import type { RenderedFacts, VisualRead } from "@/lib/types";

import renderedFixture from "./fixtures/rendered-linear.app.json";

vi.mock("@/lib/render", () => ({
  BrowserUnavailableError: class extends Error {},
  renderPage: vi.fn(),
}));
vi.mock("@/lib/judge.server", () => ({ visualRead: vi.fn() }));
vi.mock("@/lib/deadline", async (original) => ({
  ...(await original<object>()),
  sleep: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/store.server", () => ({
  hashScreenshot: () => "screenshot-hash",
  loadVisual: vi.fn(() => Promise.resolve(null)),
  saveScan: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/fetch-page", async (original) => ({
  ...(await original<object>()),
  fetchPage: vi.fn(),
}));

const TARGET: Target = {
  host: "example.com",
  slug: "example.com",
  url: "https://example.com/",
};
const HTML = "<html><body><h1>Hello</h1></body></html>";
const READ = { points: 0 } as VisualRead;
const REFUSAL = new SiteRefusedError("The site answered 403.");

const fetched: FetchedPage = {
  finalUrl: TARGET.url,
  html: HTML,
  css: [],
  notes: [],
};

const rendered = (documentStatus: number | null): RenderOutput => ({
  documentStatus,
  finalUrl: TARGET.url,
  facts: renderedFixture.rendered as unknown as RenderedFacts,
  html: HTML,
  stylesheets: [],
  screenshot: Buffer.from("pixels"),
});

beforeEach(() => {
  vi.mocked(saveScan).mockClear();
  vi.mocked(fetchPage).mockReset().mockResolvedValue(fetched);
  vi.mocked(renderPage).mockReset().mockResolvedValue(rendered(200));
  vi.mocked(visualRead).mockReset().mockResolvedValue(READ);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runScan", () => {
  it("stores a full scan with its screenshot and hash", async () => {
    const result = await runScan(TARGET);
    expect(result.rendered).toBe(true);
    expect(result.hasScreenshot).toBe(true);
    expect(result.degraded).toBe(false);
    expect(saveScan).toHaveBeenCalledWith(TARGET.slug, {
      result,
      screenshot: {
        bytes: Buffer.from("pixels"),
        hash: "screenshot-hash",
      },
    });
  });

  it("stores a scan when Jev has no key and returns null", async () => {
    vi.mocked(visualRead).mockResolvedValue(null);
    const result = await runScan(TARGET);
    expect(result.visual).toBeNull();
    expect(saveScan).toHaveBeenCalledOnce();
  });

  it("stores a page read through the browser after a direct refusal", async () => {
    vi.mocked(fetchPage).mockRejectedValue(REFUSAL);
    const result = await runScan(TARGET);
    expect(result.notes.join(" ")).toContain("refused a direct request");
    expect(saveScan).toHaveBeenCalledOnce();
  });

  it.each([
    [403, /answered 403/u],
    [503, /answered 503/u],
    [null, /no document/u],
  ])(
    "returns static checks unstored when the document status is %s",
    async (status, note) => {
      vi.mocked(renderPage).mockResolvedValue(rendered(status));
      const result = await runScan(TARGET);
      expect(result.rendered).toBe(false);
      expect(result.renderedFacts).toBeNull();
      expect(result.hasScreenshot).toBe(false);
      expect(result.notes.join(" ")).toMatch(note);
      expect(renderPage).toHaveBeenCalledOnce();
      expect(visualRead).not.toHaveBeenCalled();
      expect(saveScan).not.toHaveBeenCalled();
    }
  );

  it("scores a document that answered just under 400", async () => {
    vi.mocked(renderPage).mockResolvedValue(rendered(399));
    await expect(runScan(TARGET)).resolves.toMatchObject({ rendered: true });
    expect(saveScan).toHaveBeenCalledOnce();
  });

  it("returns static checks unstored when the render breaks after launch", async () => {
    vi.mocked(renderPage).mockRejectedValue(
      new Error("Navigation timeout\nstack detail")
    );
    const result = await runScan(TARGET);
    expect(result.rendered).toBe(false);
    expect(result.degraded).toBe(true);
    expect(result.notes.join(" ")).toContain("Navigation timeout)");
    expect(saveScan).not.toHaveBeenCalled();
  });

  it("returns the scan unstored and without a screenshot when Jev throws", async () => {
    vi.mocked(visualRead).mockRejectedValue(new Error("Jev answered 500"));
    const result = await runScan(TARGET);
    expect(result.rendered).toBe(true);
    expect(result.visual).toBeNull();
    expect(result.degraded).toBe(true);
    expect(result.hasScreenshot).toBe(false);
    expect(result.notes.join(" ")).toContain("Jev answered 500");
    expect(saveScan).not.toHaveBeenCalled();
  });

  it.each([
    ["refused too", () => Promise.resolve(rendered(403))],
    ["missing", () => Promise.resolve(rendered(null))],
    ["broken", () => Promise.reject(new Error("session lost"))],
  ])(
    "fails with the refusal when the direct fetch was refused and the render is %s",
    async (_case, render) => {
      vi.mocked(fetchPage).mockRejectedValue(REFUSAL);
      vi.mocked(renderPage).mockImplementation(render);
      await expect(runScan(TARGET)).rejects.toBe(REFUSAL);
      expect(saveScan).not.toHaveBeenCalled();
    }
  );

  it("stores a full scan when the second render works after a crash", async () => {
    vi.mocked(renderPage)
      .mockRejectedValueOnce(new Error("Navigation timeout"))
      .mockResolvedValue(rendered(200));
    const result = await runScan(TARGET);
    expect(renderPage).toHaveBeenCalledTimes(2);
    expect(result.degraded).toBe(false);
    expect(saveScan).toHaveBeenCalledOnce();
  });

  it("stores a full scan when a browser frees up for the second try", async () => {
    vi.mocked(renderPage)
      .mockRejectedValueOnce(new BrowserUnavailableError("busy"))
      .mockResolvedValue(rendered(200));
    const result = await runScan(TARGET);
    expect(result.degraded).toBe(false);
    expect(saveScan).toHaveBeenCalledOnce();
  });

  it("gives up on the render when a second one would pass the scan deadline", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.mocked(renderPage).mockImplementation(() => {
      vi.setSystemTime(Date.now() + 36_000);
      return Promise.reject(new Error("the page took too long to read"));
    });
    const result = await runScan(TARGET);
    expect(renderPage).toHaveBeenCalledOnce();
    expect(result.degraded).toBe(true);
  });

  it("fails when no browser can be had", async () => {
    const busy = new BrowserUnavailableError("busy");
    vi.mocked(renderPage).mockRejectedValue(busy);
    await expect(runScan(TARGET)).rejects.toBe(busy);
    expect(renderPage).toHaveBeenCalledTimes(2);
    expect(saveScan).not.toHaveBeenCalled();
  });
});
