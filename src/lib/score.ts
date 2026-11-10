import type { Credit, SignalResult, VisualRead } from "./types";

const FULL_SCORE = 100;
/** The most Jev's look at the screenshot gives back. */
export const JEV_MAX_POINTS = 10;
/** What a typeface of the site's own gives back. */
export const OWN_FACE_POINTS = 5;

/** Whole points a pattern takes off: its weight, scaled by how strongly it shows. A pattern found always costs at least 1. */
export const patternPoints = (weight: number, strength: number): number =>
  Math.max(1, Math.round(weight * strength));

/** What the patterns found take off, and what Jev and the credits give back. */
export const pointsOff = (signals: Pick<SignalResult, "points">[]): number =>
  signals.reduce((sum, signal) => sum + signal.points, 0);

export const pointsBack = (
  credits: Pick<Credit, "points">[],
  visual: Pick<VisualRead, "points"> | null
): number =>
  credits.reduce((sum, credit) => sum + credit.points, visual?.points ?? 0);

/**
 * A sum a reader can redo by hand from the report: 100, minus each pattern's points, plus the points given back.
 * Points given back never lift a score past 100, so a page with no patterns stays there.
 */
export const scoreOf = (
  signals: Pick<SignalResult, "points">[],
  credits: Pick<Credit, "points">[] = [],
  visual: Pick<VisualRead, "points"> | null = null
): number =>
  Math.max(
    0,
    Math.min(
      FULL_SCORE,
      FULL_SCORE - pointsOff(signals) + pointsBack(credits, visual)
    )
  );

export type CardTier = "prismatic" | "holo" | "chrome" | "matte";

export const tierFor = (score: number): CardTier => {
  if (score >= 90) {
    return "prismatic";
  }
  if (score >= 75) {
    return "holo";
  }
  if (score >= 45) {
    return "chrome";
  }
  return "matte";
};
