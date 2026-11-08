import type { AnalysisResult, VisualRead } from "./types";

/** The card prints it and its QR code links to it. */
export const SITE_HOST = "humantaste.xyz";
export const SITE_URL: string =
  import.meta.env.VITE_SITE_URL ?? `https://${SITE_HOST}`;

const MIDDLE_LOOK = "it looks like a reworked template";

const LOOK_WORDS = [
  "it looks hand-designed",
  "it looks mostly hand-designed",
  MIDDLE_LOOK,
  "it looks like a lightly edited template",
  "it looks like a template",
];

/** Jev only saw a screenshot, so its read is worded as an impression, to follow "Jev says". */
export const lookWords = (visual: VisualRead): string =>
  LOOK_WORDS[
    Math.min(LOOK_WORDS.length - 1, Math.max(0, Math.round(visual.look)))
  ] ?? MIDDLE_LOOK;

export interface ShareCard {
  host: string;
  score: number;
  /** Where the site stands among those scored, or null when the card prints no rank. */
  standing: string | null;
  /** What follows "Jev says", or null when the visual read didn't run. */
  jev: string | null;
  /** The scan's public URL, encoded in the card's QR code. */
  scanUrl: string;
}

/** A slug can hold a query string, which has to stay in the path to reach the same report. */
export const pathSlug = (slug: string) => slug.replaceAll("?", "%3F");
export const scanPath = (slug: string) => `/scan/${pathSlug(slug)}`;
export const cardPath = (slug: string) => `/og/${pathSlug(slug)}.png`;
export const shotPath = (slug: string) => `/shot/${pathSlug(slug)}.jpg`;
export const reportUrl = (slug: string) => `${SITE_URL}${scanPath(slug)}`;
export const scoreLine = (slug: string, score: number) =>
  `${slug} scores ${score}/100 on humantaste`;

/** X unfurls the last link in a post and the slug can autolink, so the report's URL has to close the text. */
export const shareOnXUrl = (slug: string, score: number) => {
  const text = `${scoreLine(slug, score)}. What does your site score?\n\n${reportUrl(slug)}`;
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
};

export const cardFromResult = (result: AnalysisResult): ShareCard => ({
  host: result.slug,
  score: result.score,
  standing: result.beats ? `Beats ${result.beats}% of sites scored` : null,
  jev: result.visual ? lookWords(result.visual) : null,
  scanUrl: `https://${SITE_HOST}${scanPath(result.slug)}`,
});
