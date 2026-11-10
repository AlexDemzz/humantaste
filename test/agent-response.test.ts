import { beforeEach, expect, it, vi } from "vitest";

import { agentResponse } from "@/lib/agent-response.server";
import { loadScan, recentScans } from "@/lib/store.server";
import type { AnalysisResult } from "@/lib/types";

vi.mock("@/lib/store.server", () => ({
  loadScan: vi.fn(),
  recentScans: vi.fn(),
}));

const BROWSER_ACCEPT = "text/html,application/xhtml+xml,*/*;q=0.8";
const REPORT = {
  slug: "linear.app",
  score: 78,
  analyzedAt: "2026-11-08T18:05:00.000Z",
  signals: [
    {
      title: "Big one",
      points: 30,
      why: "Why it counts.",
      fix: "Change it.",
      hit: { strength: 1, evidence: "line one\n`line two`", source: "css" },
    },
  ],
  credits: [{ points: 5 }],
  visual: { points: 3 },
} as unknown as AnalysisResult;

const get = (path: string, accept?: string) =>
  agentResponse(
    new Request(`https://humantaste.xyz${path}`, {
      headers: accept ? { accept } : {},
    })
  );

beforeEach(() => {
  vi.mocked(loadScan).mockReset().mockResolvedValue(REPORT);
  vi.mocked(recentScans)
    .mockReset()
    .mockResolvedValue([{ slug: "linear.app", score: 78 }]);
});

it("serves a report's Markdown, canonical to its HTML page", async () => {
  const response = await get("/md/linear.app.md");
  expect(response?.headers.get("content-type")).toContain("text/markdown");
  expect(response?.headers.get("link")).toBe(
    '<https://humantaste.xyz/scan/linear.app>; rel="canonical"'
  );
  const body = await response?.text();
  expect(body).toContain("# linear.app scores 78/100 on humantaste");
  expect(body).toContain("Evidence: `line one 'line two'`");
  expect(body).toContain(
    "Sum: 100, minus 30 for the patterns found, plus 8 given back"
  );
});

it("answers a report page in Markdown when the client asks for it", async () => {
  const response = await get("/scan/linear.app", "text/markdown");
  expect(await response?.text()).toContain("Big one");
});

it.each(["/", "/scan/linear.app", "/scan/example.md"])(
  "leaves %s to the app for a browser",
  async (path) => {
    await expect(get(path, BROWSER_ACCEPT)).resolves.toBeUndefined();
  }
);

it("serves the home page's Markdown with links to report twins", async () => {
  const response = await get("/index.md");
  const body = await response?.text();
  expect(body).toContain(
    "[linear.app](https://humantaste.xyz/md/linear.app.md): 78/100"
  );
});

it("says how to get a report that does not exist", async () => {
  vi.mocked(loadScan).mockResolvedValue(null);
  const response = await get("/md/never-scored.example.md");
  expect(response?.status).toBe(404);
  expect(await response?.text()).toContain(
    "https://humantaste.xyz/scan/never-scored.example"
  );
});

it("serves an info page's Markdown with absolute links", async () => {
  const response = await get("/privacy.md");
  expect(response?.headers.get("link")).toBe(
    '<https://humantaste.xyz/privacy>; rel="canonical"'
  );
  expect(await response?.text()).toContain(
    "[contact page](https://humantaste.xyz/contact)"
  );
});

it("answers an info page in Markdown only when the client asks for it", async () => {
  const asked = await get("/contact", "text/markdown");
  expect(await asked?.text()).toContain("# Contact");
  await expect(get("/contact", BROWSER_ACCEPT)).resolves.toBeUndefined();
});

it("keeps a slug from forging a link in the home page's Markdown", async () => {
  vi.mocked(recentScans).mockResolvedValue([
    { slug: "evil.com/](https://phish.example)y", score: 10 },
  ]);
  const response = await get("/index.md");
  expect(await response?.text()).toContain(
    String.raw`[evil.com/\](https://phish.example)y]`
  );
});

it("fails loudly when the store is down, not as a missing report", async () => {
  vi.mocked(loadScan).mockRejectedValue(new Error("D1 unavailable"));
  await expect(get("/md/linear.app.md")).rejects.toThrow("D1 unavailable");
});

it("does not answer writes", async () => {
  const request = new Request("https://humantaste.xyz/llms.txt", {
    method: "POST",
  });
  await expect(agentResponse(request)).resolves.toBeUndefined();
});
