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
