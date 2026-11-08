import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  colorStops,
  isBlue,
  isMultiHue,
  isPink,
  isPurple,
  parseColor,
} from "@/lib/color";
import { extractStatic } from "@/lib/extract";
import { factorFor } from "@/lib/judge.server";
import { HALF_AT, scoreFromPoints } from "@/lib/score";
import {
  baseFamily,
  evaluateCredits,
  evaluateSignals,
  isGoogleFont,
  scoreOf,
} from "@/lib/signals";
import type { Facts, RenderedFacts } from "@/lib/types";

const FIXTURES = path.join(import.meta.dirname, "fixtures");
const read = (file: string) => readFileSync(path.join(FIXTURES, file), "utf-8");
const EMPTY_STATIC = extractStatic("<html><body></body></html>", []);

const staticFacts = (site: string, cssFiles: string[]): Facts => ({
  url: `https://${site}/`,
  static: extractStatic(
    read(`${site}/index.html`),
    cssFiles.map((f) => read(`${site}/${f}`))
  ),
  rendered: null,
});

const loadRendered = (site: string) =>
  JSON.parse(read(`rendered-${site}.json`)) as {
    url: string;
    rendered: RenderedFacts;
  };

const renderedFacts = (site: string): Facts => {
  const { url, rendered } = loadRendered(site);
  return { url, rendered, static: EMPTY_STATIC };
};

const htmlFacts = (html: string): Facts => ({
  url: "https://a.com/",
  static: extractStatic(html, []),
  rendered: null,
});
const proseFacts = (text: string): Facts => htmlFacts(`<p>${text}</p>`);
const listFacts = (items: string[]): Facts =>
  htmlFacts(`<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`);
const cssFacts = (css: string): Facts => ({
  url: "https://a.com/",
  static: extractStatic("<html></html>", [css]),
  rendered: null,
});

const hitIds = (facts: Facts) =>
  evaluateSignals(facts)
    .filter((s) => s.hit)
    .map((s) => s.id);
const hit = (facts: Facts, id: string) =>
  evaluateSignals(facts).find((s) => s.id === id)?.hit ?? null;

describe("the score curve", () => {
  it("gives 100 with no tells and 50 at the half-way point", () => {
    expect(scoreFromPoints(0)).toBe(100);
    expect(scoreFromPoints(HALF_AT)).toBe(50);
  });

  it("charges little for one habit and most of the score for five stacked tells", () => {
    expect(scoreFromPoints(5)).toBeGreaterThanOrEqual(95);
    expect(scoreFromPoints(5 * 7)).toBeLessThan(45);
  });

  it("maps the visual read onto a 0.5–1.5 weight", () => {
    expect(factorFor(0)).toBe(0.5);
    expect(factorFor(2)).toBe(1);
    expect(factorFor(4)).toBe(1.5);
  });
});

describe("static checks on captured pages", () => {
  it("spots the stock shadcn v3 zinc theme in a popular shadcn landing template", () => {
    expect(
      hit(
        staticFacts("shadcn-landing-page.vercel.app", ["style-1.css"]),
        "stock-tokens"
      )?.evidence
    ).toContain("--foreground: 240 10% 3.9%");
  });

  it("does not call a hue-tinted custom theme stock", () => {
    expect(
      hitIds(staticFacts("alexandrejoly.me", ["style-1.css"]))
    ).not.toContain("stock-tokens");
  });

  it("matches minified and percent forms of the stock tokens", () => {
    const facts = extractStatic("<html><body></body></html>", [
      ":root{--radius:.625rem;--foreground:oklch(14.5% 0 0);--primary:oklch(.205 0 0)}",
    ]);
    expect(
      hit(
        { url: "https://example.com/", static: facts, rendered: null },
        "stock-tokens"
      )?.evidence
    ).toMatch(
      /--radius: 0\.625rem.*--foreground: oklch\(0\.145 0 0\).*--primary/u
    );
  });

  it("finds template phrases in shadcnblocks.com's copy and none on a hand-written page", () => {
    expect(
      hit(staticFacts("shadcnblocks.com", []), "buzzwords")?.evidence
    ).toMatch(/seamless/u);
    expect(
      hitIds(staticFacts("alexandrejoly.me", ["style-1.css"]))
    ).not.toContain("buzzwords");
  });

  it("skips English copy checks on pages in another language", () => {
    const facts = extractStatic(
      '<html lang="fr"><body><p>Seamlessly supercharge your workflow, unlock the future of everything.</p></body></html>',
      []
    );
    const buzz = evaluateSignals({
      url: "https://example.fr/",
      static: facts,
      rendered: null,
    }).find((s) => s.id === "buzzwords");
    expect(buzz?.checked).toBe(false);
  });

  it("flags a head still set to the starter's values", () => {
    const lovable = extractStatic(
      '<html><head><title>freesubtitlemaker</title><meta name="author" content="Lovable"><meta name="twitter:site" content="@Lovable"></head><body></body></html>',
      []
    );
    const vite = extractStatic(
      '<html><head><title>Vite + React + TS</title><link rel="icon" type="image/svg+xml" href="/vite.svg"></head><body></body></html>',
      []
    );
    expect(
      hit(
        { url: "https://a.lovable.app/", static: lovable, rendered: null },
        "starter-head"
      )?.evidence
    ).toMatch(/author “Lovable”.*@Lovable/u);
    expect(
      hit(
        { url: "https://a.vercel.app/", static: vite, rendered: null },
        "starter-head"
      )?.evidence
    ).toMatch(/Vite \+ React \+ TS.*\/vite\.svg/u);
  });

  it("leaves a head the site wrote itself alone", () => {
    const own = extractStatic(
      '<html><head><title>Vite, the build tool</title><meta name="description" content="Next generation frontend tooling."><link rel="icon" href="/logo.svg"></head><body></body></html>',
      []
    );
    expect(
      hit(
        { url: "https://vite.dev/", static: own, rendered: null },
        "starter-head"
      )
    ).toBeNull();
  });

  it("counts em dashes by density, never by presence", () => {
    const sparse = extractStatic(
      `<p>${"A long sentence with no dash at all. ".repeat(60)}One — here.</p>`,
      []
    );
    const dense = extractStatic(
      `<p>${"Fast — simple — yours. ".repeat(10)}</p>`,
      []
    );
    expect(
      hit(
        { url: "https://a.com/", static: sparse, rendered: null },
        "em-dashes"
      )
    ).toBeNull();
    expect(
      hit({ url: "https://a.com/", static: dense, rendered: null }, "em-dashes")
    ).not.toBeNull();
  });

  it("needs several model-favoured words before calling the vocabulary generated", () => {
    const human =
      "Crucial fixes ship weekly. We enhance the parser and add numerous tests. Additionally, the CLI is faster.";
    const model =
      "Our platform serves as a testament to craft. Delve into a vibrant tapestry of pivotal tools that foster growth.";
    expect(hit(proseFacts(human), "ai-vocabulary")).toBeNull();
    expect(hit(proseFacts(model), "ai-vocabulary")?.evidence).toMatch(
      /delve.*tapestry|testament/u
    );
  });

  it("hears ‘not just X, but Y’ as the same rebuttal cadence once it repeats", () => {
    expect(
      hit(
        proseFacts(
          "It's not just a tool, but a partner. Not only fast, but also safe."
        ),
        "contrast-cadence"
      )
    ).not.toBeNull();
    expect(
      hit(proseFacts("Not only fast, but also safe."), "contrast-cadence")
    ).toBeNull();
  });

  it("treats a chatbot's reply left in the page as a placeholder", () => {
    const facts = extractStatic(
      "<p>Fast invoicing for freelancers. I hope this helps! Feel free to customize this section.</p>",
      []
    );
    expect(
      hit(
        { url: "https://a.com/", static: facts, rendered: null },
        "placeholders"
      )?.evidence
    ).toContain("chatbot reply");
  });

  it("finds chatbot markup and raw Markdown pasted into the page, but not inside code samples", () => {
    const pasted =
      '<p>We cut costs by 40% citeturn0search2. **Fast setup** and **Real support**. <a href="https://b.com/?utm_source=chatgpt.com">Read</a></p>';
    expect(hit(htmlFacts(pasted), "placeholders")?.evidence).toMatch(
      /citation markup.*utm_source.*raw Markdown/u
    );
    expect(
      hit(
        htmlFacts(
          "<p>Write it like this:</p><pre><code>## Title\n**bold** and **more** [link](https://a.com)</code></pre>"
        ),
        "placeholders"
      )
    ).toBeNull();
  });

  it("flags bullets that open with ‘Label:’ but not a bold lead-in that ends in a full stop", () => {
    const labelled = [
      "<strong>Speed:</strong> Speed improved",
      "<strong>Security</strong>: Secure by default",
      "<b>Scale:</b> Scales well",
      "<p><strong>Support:</strong> We help</p>",
    ];
    const leadIns = [
      "<strong>Schema in TypeScript.</strong> Tables live in one file.",
      "<strong>One binary.</strong> No runtime.",
      "<strong>Typed SQL.</strong> Errors at build.",
      "<strong>Local first.</strong> Works offline.",
    ];
    expect(hit(listFacts(labelled), "labelled-items")?.evidence).toMatch(
      /^4 list items/u
    );
    expect(hit(listFacts(leadIns), "labelled-items")).toBeNull();
  });

  it("flags overshooting easing but not a hair of overshoot", () => {
    expect(
      hit(
        cssFacts(
          "a{transition:all .3s cubic-bezier(.1,0,.1,1.1)}b{transition:all .3s cubic-bezier(.2,0,0,1.1)}"
        ),
        "bounce-easing"
      )
    ).toBeNull();
    expect(
      hit(
        cssFacts(
          "a{transition:all .3s cubic-bezier(.34,1.56,.64,1)}b{transition:all .3s cubic-bezier(.68,-.55,.27,1.55)}"
        ),
        "bounce-easing"
      )
    ).not.toBeNull();
  });
});

describe("rendered checks on captured measurements", () => {
  it("finds nothing on alexandrejoly.me", () => {
    const facts: Facts = {
      ...renderedFacts("alexandrejoly.me"),
      static: extractStatic(read("alexandrejoly.me/index.html"), [
        read("alexandrejoly.me/style-1.css"),
      ]),
    };
    expect(hitIds(facts)).toEqual([]);
    expect(scoreOf(evaluateSignals(facts))).toBe(100);
  });

  it("stacks up the generated look of a Lovable-built landing page", () => {
    const facts = renderedFacts("freesubtitlemaker.lovable.app");
    expect(hitIds(facts)).toEqual(
      expect.arrayContaining([
        "accent-word",
        "eyebrow-pill",
        "card-row",
        "icon-tiles",
        "purple",
        "orbs",
        "glass",
        "lucide-logo",
      ])
    );
    expect(scoreOf(evaluateSignals(facts))).toBeLessThan(30);
  });

  it("lets Linear keep Inter and its one indigo button without sinking", () => {
    const facts = renderedFacts("linear.app");
    expect(hitIds(facts)).not.toContain("purple");
    expect(scoreOf(evaluateSignals(facts))).toBeGreaterThanOrEqual(85);
  });

  it("doesn't penalise a workhorse sans, Geist and Inter included", () => {
    const { rendered } = loadRendered("linear.app");
    const geist = {
      ...rendered,
      fonts: [{ family: "Geist", glyphs: 4000, webfont: true }],
      headingFonts: [{ family: "Geist SemiBold", glyphs: 200, webfont: true }],
    };
    const typeHits = evaluateSignals({
      url: "https://vercel.com/",
      rendered: geist,
      static: EMPTY_STATIC,
    }).filter((s) => s.category === "type" && s.hit);
    expect(typeHits).toEqual([]);
  });

  it("flags this year's display serif in headings, not this year's sans", () => {
    const { rendered } = loadRendered("linear.app");
    const headings = (family: string) => ({
      url: "https://a.com/",
      static: EMPTY_STATIC,
      rendered: {
        ...rendered,
        headingFonts: [{ family, glyphs: 200, webfont: true }],
      },
    });
    expect(
      hit(headings("Instrument Serif"), "second-wave-face")?.evidence
    ).toMatch(/instrument serif/iu);
    expect(hit(headings("Space Grotesk Bold"), "second-wave-face")).toBeNull();
  });

  it("exempts a pill that links to dated news, and flags a hype one", () => {
    const { rendered } = loadRendered("freesubtitlemaker.lovable.app");
    const withPill = (pill: RenderedFacts["pill"]) => ({
      url: "https://a.com/",
      static: EMPTY_STATIC,
      rendered: { ...rendered, pill },
    });
    expect(
      hit(
        withPill({
          text: "v4.2 released Oct 30",
          href: "https://a.com/changelog",
        }),
        "eyebrow-pill"
      )
    ).toBeNull();
    expect(
      hit(
        withPill({ text: "✨ Introducing Magic", href: null }),
        "eyebrow-pill"
      )?.strength
    ).toBe(1);
  });

  it("ignores a two-tone headline whose second part is only greyed out", () => {
    const { rendered } = loadRendered("freesubtitlemaker.lovable.app");
    const accent = (headlineAccent: RenderedFacts["headlineAccent"]) => ({
      url: "https://a.com/",
      static: EMPTY_STATIC,
      rendered: { ...rendered, headlineAccent },
    });
    expect(
      hit(
        accent({
          word: "Do it on your Mac.",
          colour: "rgb(150, 150, 152)",
          italic: false,
          font: null,
          gradient: false,
        }),
        "accent-word"
      )
    ).toBeNull();
    expect(
      hit(
        accent({
          word: "magic",
          colour: null,
          italic: true,
          font: "Instrument Serif",
          gradient: false,
        }),
        "accent-word"
      )?.strength
    ).toBe(1);
  });
});

describe("credits for deliberate choices", () => {
  it("credits Stripe's licensed face and not a Google font", () => {
    expect(
      evaluateCredits(renderedFacts("stripe.com")).map((c) => c.id)
    ).toEqual(["own-typeface"]);
    expect(evaluateCredits(renderedFacts("devenny.vercel.app"))).toEqual([]);
  });

  it("strips Chrome's weight and optical-size suffixes before looking a family up", () => {
    expect(baseFamily("Bricolage Grotesque 96pt ExtraBold")).toBe(
      "bricolage grotesque"
    );
    expect(isGoogleFont("DM Sans 9pt Light")).toBe(true);
    expect(isGoogleFont("Domaine Display Narrow")).toBe(false);
  });
});

describe("colour", () => {
  const chrome = JSON.parse(read("chrome-tailwind-colors.json")) as Record<
    string,
    { lab: string; srgb: string; gradient: string }
  >;

  it.each(["lab", "srgb"] as const)(
    "sorts Tailwind's indigo, purple, pink and blue from %s output",
    (format) => {
      const get = (name: string) => {
        const color = parseColor(chrome[name]?.[format] ?? "");
        if (!color) {
          throw new Error(`No ${format} colour for ${name}`);
        }
        return color;
      };
      expect(isPurple(get("indigo-500"))).toBe(true);
      expect(isPurple(get("purple-500"))).toBe(true);
      expect(isPink(get("pink-500"))).toBe(true);
      expect(isBlue(get("blue-500"))).toBe(true);
      expect(isPurple(get("blue-500"))).toBe(false);
      for (const name of ["emerald-500", "neutral-500"]) {
        expect(isPurple(get(name)) || isPink(get(name))).toBe(false);
      }
    }
  );

  it("tells a tonal ramp from a hue jump", () => {
    expect(
      isMultiHue(
        colorStops(
          "linear-gradient(90deg, rgb(255, 255, 255), rgb(120, 120, 120))"
        )
      )
    ).toBe(false);
    expect(
      isMultiHue(
        colorStops(
          "linear-gradient(90deg, oklch(0.6 0.2 250), oklch(0.7 0.18 270))"
        )
      )
    ).toBe(false);
    expect(
      isMultiHue(
        colorStops(
          "linear-gradient(90deg, oklch(0.6 0.2 280), oklch(0.7 0.2 350))"
        )
      )
    ).toBe(true);
  });

  it("ignores fully transparent stops", () => {
    expect(
      isMultiHue(
        colorStops("linear-gradient(rgba(255, 0, 0, 0), rgb(0, 0, 255))")
      )
    ).toBe(false);
  });
});
