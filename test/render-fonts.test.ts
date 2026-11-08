import type { Page } from "@cloudflare/playwright";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { collectFonts } from "@/lib/render";

vi.mock("cloudflare:workers", () => ({ env: {} }));
vi.mock("@cloudflare/playwright", () => ({ launch: vi.fn() }));
vi.mock("@/lib/net-guard", () => ({ resolvesPublic: vi.fn() }));

const NODE_COUNT = 160;
const SLOW_QUERY_MS = 1000;
const FAST_QUERY_MS = 1;
const MAX_FONT_QUERIES_ON_A_SLOW_PAGE = 10;
const GLYPHS_PER_NODE = 10;

const pageAnswering = (queryMs: number) => {
  const fontQueries = vi.fn();
  const send = vi.fn((method: string) => {
    if (method === "DOM.getDocument") {
      return Promise.resolve({ root: { nodeId: 1 } });
    }
    if (method === "DOM.querySelectorAll") {
      return Promise.resolve({
        nodeIds: Array.from({ length: NODE_COUNT }, (_, id) => id),
      });
    }
    if (method === "CSS.getPlatformFontsForNode") {
      fontQueries();
      vi.advanceTimersByTime(queryMs);
      return Promise.resolve({
        fonts: [
          {
            familyName: "Inter",
            glyphCount: GLYPHS_PER_NODE,
            isCustomFont: true,
          },
        ],
      });
    }
    return Promise.resolve({});
  });
  const newCDPSession = () =>
    Promise.resolve({ send, detach: () => Promise.resolve() });
  const page = { context: () => ({ newCDPSession }) } as unknown as Page;
  return { page, fontQueries };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("ends the sample with what it has when the page answers slowly", async () => {
  const { page, fontQueries } = pageAnswering(SLOW_QUERY_MS);
  const fonts = await collectFonts(page, "p");
  expect(fontQueries.mock.calls.length).toBeLessThanOrEqual(
    MAX_FONT_QUERIES_ON_A_SLOW_PAGE
  );
  expect(fonts[0]?.family).toBe("Inter");
});

it("samples every node when the page answers quickly", async () => {
  const { page, fontQueries } = pageAnswering(FAST_QUERY_MS);
  const fonts = await collectFonts(page, "p");
  expect(fontQueries).toHaveBeenCalledTimes(NODE_COUNT);
  expect(fonts[0]?.glyphs).toBe(NODE_COUNT * GLYPHS_PER_NODE);
});
