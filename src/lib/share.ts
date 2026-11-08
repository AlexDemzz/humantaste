import type { AnalysisResult, VisualRead } from "./types";

/** The card prints it and its QR code links to it. */
export const SITE_HOST = "humantaste.xyz";

const LOOK_WORDS = [
  "clearly hand-designed",
  "mostly considered",
  "mixed",
  "mostly template",
  "straight from a generator",
];

/** Jev's read of the screenshot in words, from "clearly hand-designed" (0) to "straight from a generator" (4). */
export const lookWords = (visual: VisualRead): string =>
  LOOK_WORDS[
    Math.min(LOOK_WORDS.length - 1, Math.max(0, Math.round(visual.look)))
  ] ?? "mixed";

export interface ShareCard {
  host: string;
  score: number;
  verdict: string;
  /** Jev's words with a capital, or null when the visual read didn't run. */
  jev: string | null;
  /** The scan's public URL, encoded in the card's QR code. */
  scanUrl: string;
}

export const scanPath = (slug: string) => `/scan/${slug}`;
export const cardPath = (slug: string) => `/og/${slug}.png`;
export const shotPath = (slug: string) => `/shot/${slug}.jpg`;

export const cardFromResult = (result: AnalysisResult): ShareCard => {
  const words = result.visual ? lookWords(result.visual) : null;
  return {
    host: result.slug,
    score: result.score,
    verdict: result.verdict,
    jev: words ? words.charAt(0).toUpperCase() + words.slice(1) : null,
    scanUrl: `https://${SITE_HOST}${scanPath(result.slug)}`,
  };
};
