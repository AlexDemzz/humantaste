import * as cheerio from "cheerio";

import type { CssVar, StaticFacts } from "./types";

const CSS_VAR = /(?<name>--[\w-]+)\s*:\s*(?<value>[^;}]+)/gu;
const FONT_FACE_FAMILY =
  /@font-face\s*\{[^}]*?font-family\s*:\s*(?<families>[^;}]+)/giu;
const FONT_FAMILY_DECL = /(?:^|[;{\s])font-family\s*:\s*(?<families>[^;}]+)/giu;
const BULLET_SELECTOR = "li, h3, h4, h5, dt, p";
const LABEL_MAX = 40;

/** Normalizes a CSS value so minified and pretty output compare equal: `0.625rem` and `.625rem` both become `.625rem`. */
export const normalizeCssValue = (value: string): string =>
  value
    .toLowerCase()
    .replaceAll("!important", "")
    .replaceAll(
      /oklch\(\s*(?<pct>\d+(?:\.\d+)?)%/gu,
      (_, pct: string) => `oklch(${Number(pct) / 100}`
    )
    .replaceAll(/\s+/gu, " ")
    .replaceAll(/(?<lead>^|[\s(,/])0\.(?<digit>\d)/gu, "$<lead>.$<digit>")
    .replaceAll(/\s*(?<punct>[(),/])\s*/gu, "$<punct>")
    .trim();

const firstFamilies = (value: string): string[] =>
  value
    .split(",")
    .map((family) =>
      family
        .trim()
        .replaceAll(/^["']|["']$/gu, "")
        .toLowerCase()
    )
    .filter(Boolean);

export const extractStatic = (
  html: string,
  cssSources: string[]
): StaticFacts => {
  const css = cssSources.join("\n");
  const cssVars: CssVar[] = [];
  for (const match of css.matchAll(CSS_VAR)) {
    const { name, value } = match.groups ?? {};
    if (name && value) {
      cssVars.push({ name, value: normalizeCssValue(value) });
    }
  }

  const declared = new Set<string>();
  for (const match of css.matchAll(FONT_FACE_FAMILY)) {
    for (const family of firstFamilies(match.groups?.families ?? "")) {
      declared.add(family);
    }
  }
  for (const match of css.matchAll(FONT_FAMILY_DECL)) {
    const [first] = firstFamilies(match.groups?.families ?? "");
    if (first) {
      declared.add(first);
    }
  }

  const $ = cheerio.load(html);
  $("script, style, noscript, template, svg").remove();
  const bulletTexts = $(BULLET_SELECTOR)
    .map((_, el) => $(el).text().trim().replaceAll(/\s+/gu, " "))
    .get()
    .filter((text) => text.length > 0 && text.length < 300);

  const labelledItems = $("li")
    .map((_, el) => {
      const item = $(el).text().replaceAll(/\s+/gu, " ").trim();
      const label = $(el)
        .find("strong, b")
        .first()
        .text()
        .replaceAll(/\s+/gu, " ")
        .trim();
      if (!label || !item.startsWith(label) || label.length > LABEL_MAX) {
        return null;
      }
      const colon =
        label.endsWith(":") ||
        item.slice(label.length).trimStart().startsWith(":");
      return colon ? label.replace(/:$/u, "") : null;
    })
    .get()
    .filter((label): label is string => Boolean(label));

  const $prose = cheerio.load(html);
  $prose(
    "script, style, noscript, template, svg, pre, code, kbd, samp, textarea"
  ).remove();

  const classTokens: string[] = [];
  const $raw = cheerio.load(html);
  $raw("[class]").each((_, el) => {
    for (const token of ($raw(el).attr("class") ?? "").split(/\s+/u)) {
      if (token) {
        classTokens.push(token);
      }
    }
  });

  const meta = (selector: string) =>
    ($raw(selector).attr("content") ?? "").trim();
  const head = {
    title: $raw("head title").first().text().trim(),
    description: meta('meta[name="description"]'),
    author: meta('meta[name="author"]'),
    twitterSite: meta('meta[name="twitter:site"]'),
    ogImage: meta('meta[property="og:image"]'),
    icons: $raw('link[rel~="icon"]')
      .map((_, el) => $raw(el).attr("href") ?? "")
      .get()
      .filter(Boolean),
  };

  return {
    cssVars,
    declaredFamilies: [...declared],
    text: $("body").text().replaceAll(/\s+/gu, " ").trim(),
    prose: $prose("body").text().replaceAll(/\s+/gu, " ").trim(),
    lang: ($raw("html").attr("lang") ?? "").toLowerCase(),
    h1: $("h1").first().text().replaceAll(/\s+/gu, " ").trim(),
    bulletTexts,
    labelledItems,
    classTokens,
    head,
    cssLower: css.toLowerCase(),
    htmlLower: html.toLowerCase(),
  };
};
