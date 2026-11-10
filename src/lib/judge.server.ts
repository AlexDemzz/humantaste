import { sleep, withJitter } from "./deadline";
import { JEV_MAX_POINTS } from "./score";
import type { VisualRead } from "./types";

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-preview";
const TIMEOUT_MS = 20_000;
const RETRY_PAUSE_MS = 1000;
const MAX_RETRY_AFTER_MS = 5000;
const MS_PER_SECOND = 1000;
const TOO_MANY_REQUESTS = 429;
const FIRST_SERVER_ERROR = 500;
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
/** The middle criterion: from here to a generator look, Jev gives nothing back. */
const MIXED_LOOK = MAX_LOOK / 2;

/**
 * Turns the visual read into whole points given back: all of them for a clearly hand-designed look,
 * none for a mixed one or worse. It never takes points off, so a page with no patterns stays at 100.
 */
export const pointsFor = (look: number): number =>
  Math.max(0, Math.round(JEV_MAX_POINTS * (1 - look / MIXED_LOOK)));

interface JevScoreAnswer {
  score: number;
  confidence: number;
}

/** How long to wait before asking again, or null when this answer stands. */
const retryPause = (res: Response): number | null => {
  if (res.status !== TOO_MANY_REQUESTS && res.status < FIRST_SERVER_ERROR) {
    return null;
  }
  const header = res.headers.get("retry-after");
  const seconds = header ? Number(header) : Number.NaN;
  if (Number.isNaN(seconds)) {
    return withJitter(RETRY_PAUSE_MS);
  }
  const asked = seconds * MS_PER_SECOND;
  return asked <= MAX_RETRY_AFTER_MS ? asked : null;
};

/** One more ask after a network error, a timeout, a 429 or a 5xx. Any other answer is final. */
const withOneRetry = async (
  send: () => Promise<Response>
): Promise<Response> => {
  let pause: number | null = null;
  try {
    const res = await send();
    pause = retryPause(res);
    if (pause === null) {
      return res;
    }
  } catch {
    pause = withJitter(RETRY_PAUSE_MS);
  }
  await sleep(pause);
  return await send();
};

export const visualRead = async (
  screenshot: Buffer,
  url: string
): Promise<VisualRead | null> => {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) {
    return null;
  }
  const body = JSON.stringify({
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
  });
  const res = await withOneRetry(() =>
    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        "TypeSafe-Danger-Zone-Images": "true",
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  );
  if (!res.ok) {
    throw new Error(`Jev answered ${res.status}`);
  }
  const answer = (await res.json()) as {
    model: string;
    answers: { default_look: JevScoreAnswer };
  };
  const { score, confidence } = answer.answers.default_look;
  return {
    look: Math.round(score * 100) / 100,
    outOf: MAX_LOOK,
    confidence: Math.round(confidence * 100) / 100,
    points: pointsFor(score),
    model: answer.model,
  };
};
