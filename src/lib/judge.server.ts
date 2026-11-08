import type { VisualRead } from "./types";

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-preview";
const TIMEOUT_MS = 20_000;
const SHOT = "screenshot";

/** Jev only sees the screenshot, so its read stays independent of the code's measurements. */
const QUESTION = {
  type: "score",
  instructions:
    "Overall, how much does the page in `screenshot` look like an unmodified AI-generated or template landing page, as opposed to a considered, hand-designed site? Minimalism, neutral colours or a system font are not template signals on their own; judge whether the choices look intentional (consistent spacing, restrained hierarchy, custom details) or like untouched defaults (stock gradients, glowing accents, generic hero + CTA pair, decorative blur).",
  criteria: [
    "Clearly hand-designed: distinctive, consistent choices throughout",
    "Mostly considered, a few default patterns",
    "Mixed: a template base with some customisation",
    "Mostly template defaults with light customisation",
    "Straight out of a generator or template, nothing changed",
  ],
} as const;

const MAX_LOOK = QUESTION.criteria.length - 1;
const MIN_FACTOR = 0.5;
const MAX_FACTOR = 1.5;

/**
 * Turns the visual read into a weight on the code's tell points: ×0.5 for a clearly hand-designed look,
 * ×1 for a mixed one, ×1.5 for a generator look. It never creates points, so a page with no tells stays at 100.
 */
export const factorFor = (look: number): number =>
  Math.round(
    (MIN_FACTOR + ((MAX_FACTOR - MIN_FACTOR) * look) / MAX_LOOK) * 100
  ) / 100;

interface JevScoreAnswer {
  score: number;
  confidence: number;
}

export const visualRead = async (
  screenshot: Buffer,
  url: string
): Promise<VisualRead | null> => {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) {
    return null;
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      "TypeSafe-Danger-Zone-Images": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      state: { url, screenshot: SHOT },
      questions: { default_look: QUESTION },
      assets: {
        [SHOT]: {
          type: "image",
          format: "jpeg",
          data_base64: screenshot.toString("base64"),
        },
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Jev answered ${res.status}`);
  }
  const body = (await res.json()) as {
    model: string;
    answers: { default_look: JevScoreAnswer };
  };
  const { score, confidence } = body.answers.default_look;
  return {
    look: Math.round(score * 100) / 100,
    outOf: MAX_LOOK,
    confidence: Math.round(confidence * 100) / 100,
    factor: factorFor(score),
    model: body.model,
  };
};
