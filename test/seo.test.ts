import { describe, expect, it } from "vitest";

import {
  reportDescription,
  reportHead,
  sitemapXml,
  unscoredHead,
} from "@/lib/seo";
import type { AnalysisResult, SignalResult } from "@/lib/types";

const signal = (title: string, points: number, hit: boolean) =>
  ({
    title,
    points,
    hit: hit ? { strength: 1, evidence: "evidence", source: "css" } : null,
  }) as SignalResult;

const report = (overrides: Partial<AnalysisResult> = {}) =>
  ({
    slug: "linear.app",
    score: 78,
    finalUrl: "https://linear.app/",
    analyzedAt: "2026-11-08T18:05:00.000Z",
    signals: [signal("Small one", 2, true), signal("Big one", 6, true)],
    ...overrides,
  }) as AnalysisResult;

const metaContent = (head: ReturnType<typeof reportHead>, key: string) =>
  head.meta.find((tag) => tag.name === key || tag.property === key)?.content;

describe("reportDescription", () => {
  it("names the pattern that cost the most", () => {
    expect(reportDescription(report())).toBe(
      "linear.app scores 78/100, where 0 is a pure AI template. 2 AI patterns found, the biggest: Big one. See the evidence and the fixes."
    );
  });

  it("says when nothing was found", () => {
    const clean = report({ signals: [signal("Small one", 0, false)] });
    expect(reportDescription(clean)).toBe(
      "linear.app scores 78/100, where 0 is a pure AI template. No AI patterns found in 1 checks."
    );
  });
});

describe("page heads", () => {
  it("gives a report its own canonical URL and score card", () => {
    const head = reportHead(report());
    expect(head.links).toContainEqual({
      rel: "canonical",
      href: "https://humantaste.xyz/scan/linear.app",
    });
    expect(metaContent(head, "og:image")).toBe(
      "https://humantaste.xyz/og/linear.app.png"
    );
    expect(metaContent(head, "robots")).toBeUndefined();
  });

  it("keeps a site with no score out of search, with the site card", () => {
    const head = unscoredHead("never-scored.example");
    expect(metaContent(head, "robots")).toBe("noindex");
    expect(head.links.some((link) => link.rel === "canonical")).toBe(false);
    expect(metaContent(head, "og:image")).toBe("https://humantaste.xyz/og.png");
    expect(metaContent(head, "twitter:card")).toBe("summary_large_image");
  });

  it("cannot be closed early by text from a scored site", () => {
    const head = reportHead(report({ slug: "evil.example/</script><b>" }));
    expect(head.scripts?.[0]?.children).not.toContain("</script>");
  });
});

describe("sitemapXml", () => {
  it("lists the home page and each report with its date, escaped", () => {
    const xml = sitemapXml([
      { slug: "example.com/a?b=1&c=2", analyzedAt: "2026-11-08T18:05:00.000Z" },
    ]);
    expect(xml).toContain("<loc>https://humantaste.xyz/</loc>");
    expect(xml).toContain("<loc>https://humantaste.xyz/privacy</loc>");
    expect(xml).toContain(
      "<loc>https://humantaste.xyz/scan/example.com/a%3Fb=1&amp;c=2</loc><lastmod>2026-11-08T18:05:00.000Z</lastmod>"
    );
  });
});
