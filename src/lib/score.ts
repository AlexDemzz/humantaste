/**
 * Tell points at which a page lands on 50: about three strong tells, or five middling ones.
 * The curve is flat near 100 so one habit costs little, and steep once tells stack up.
 */
export const HALF_AT = 30;

export const scoreFromPoints = (points: number): number =>
  Math.round(100 / (1 + (points / HALF_AT) ** 2));

export const verdictFor = (score: number): string => {
  if (score >= 85) {
    return "Hand-made. Someone made choices here.";
  }
  if (score >= 65) {
    return "Mostly yours, with a few defaults showing.";
  }
  if (score >= 45) {
    return "Half template, half taste.";
  }
  if (score >= 25) {
    return "The defaults are doing most of the talking.";
  }
  return "Straight out of the generator.";
};

export type CardTier = "prismatic" | "holo" | "chrome" | "matte";

export const tierFor = (score: number): CardTier => {
  if (score >= 100) {
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
