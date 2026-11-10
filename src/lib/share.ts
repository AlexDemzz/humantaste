import type { AnalysisResult, VisualRead } from "./types";

/** The card prints it and its QR code links to it. */
export const SITE_HOST = "humantaste.xyz";
export const SITE_URL: string =
  import.meta.env.VITE_SITE_URL ?? `https://${SITE_HOST}`;

const MIDDLE_LOOK = "it's AI with some taste";

const LOOK_WORDS = [
  "it's pure human taste",
  "it's got real taste",
  MIDDLE_LOOK,
  "it's almost AI slop",
  "it's AI slop",
];

/** What follows "Jev says". */
export const lookWords = (visual: VisualRead): string =>
  LOOK_WORDS[
    Math.min(LOOK_WORDS.length - 1, Math.max(0, Math.round(visual.look)))
  ] ?? MIDDLE_LOOK;

export interface ShareCard {
  host: string;
  score: number;
  /** The scan's public URL, encoded in the card's QR code. */
  scanUrl: string;
}

/** A slug can hold a query string, which has to stay in the path to reach the same report. */
export const pathSlug = (slug: string) => slug.replaceAll("?", "%3F");
export const scanPath = (slug: string) => `/scan/${pathSlug(slug)}`;
export const cardPath = (slug: string) => `/og/${pathSlug(slug)}.png`;
export const cardVideoPath = (slug: string) => `/og/${pathSlug(slug)}.mp4`;
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
  scanUrl: `https://${SITE_HOST}${scanPath(result.slug)}`,
});
