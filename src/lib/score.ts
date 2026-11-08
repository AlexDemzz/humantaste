/**
 * Tell points at which a page lands on 50: about three strong tells, or five middling ones.
 * The curve is flat near 100 so one habit costs little, and steep once tells stack up.
 */
export const HALF_AT = 30;

export const scoreFromPoints = (points: number): number =>
  Math.round(100 / (1 + (points / HALF_AT) ** 2));

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

const MIN_OTHER_SCANS = 200;
const MIN_PERCENT_PRINTED = 10;
const MAX_PERCENT_PRINTED = 99;

/**
 * The share of other scored sites a site beats, for the card. Null while there are too few scans for it to mean
 * anything, and for a figure so low that printing it would read as mockery.
 */
export const percentBeaten = (below: number, others: number): number | null => {
  if (others < MIN_OTHER_SCANS) {
    return null;
  }
  const percent = Math.min(
    MAX_PERCENT_PRINTED,
    Math.floor((100 * below) / others)
  );
  return percent < MIN_PERCENT_PRINTED ? null : percent;
};
