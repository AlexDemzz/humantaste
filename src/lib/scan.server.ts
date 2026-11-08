import { extractStatic } from "./extract";
import { fetchPage } from "./fetch-page";
import { visualRead } from "./judge.server";
import { renderPage } from "./render";
import { scoreFromPoints, verdictFor } from "./score";
import {
  evaluateCredits,
  evaluateSignals,
  METHODOLOGY,
  rawPoints,
  tellPoints,
} from "./signals";
import { loadScan, saveScan } from "./store.server";
import type { Target } from "./target";
import type { AnalysisResult, RenderedFacts, VisualRead } from "./types";

const MAX_CONCURRENT_RENDERS = 2;
const inFlight = new Map<string, Promise<AnalysisResult>>();
let running = 0;
const queue: (() => void)[] = [];

const withSlot = async <T>(task: () => Promise<T>): Promise<T> => {
  if (running >= MAX_CONCURRENT_RENDERS) {
    // oxlint-disable-next-line promise/avoid-new -- parks the task until a render slot frees; the queue holds its resolver
    await new Promise<void>((resolve) => {
      queue.push(resolve);
    });
  }
  running += 1;
  try {
    return await task();
  } finally {
    running -= 1;
    queue.shift()?.();
  }
};

const analyze = async (target: Target): Promise<AnalysisResult> => {
  const page = await fetchPage(target.url);
  const notes = [...page.notes];

  let rendered: RenderedFacts | null = null;
  let renderedHtml: string | null = null;
  let screenshot: Buffer | null = null;
  try {
    ({
      facts: rendered,
      html: renderedHtml,
      screenshot,
    } = await renderPage(page.finalUrl));
  } catch (error) {
    notes.push(
      `Rendering failed (${error instanceof Error ? error.message.split("\n")[0] : "unknown error"}), so layout checks were skipped.`
    );
  }

  let visual: VisualRead | null = null;
  if (screenshot) {
    try {
      visual = await visualRead(screenshot, page.finalUrl);
    } catch (error) {
      notes.push(
        `The visual read failed (${error instanceof Error ? error.message : "unknown error"}), so tell points are unweighted.`
      );
    }
  }

  const facts = {
    url: page.finalUrl,
    static: extractStatic(
      renderedHtml ?? page.html,
      page.css.map((c) => c.text)
    ),
    rendered,
  };
  const signals = evaluateSignals(facts);
  const credits = evaluateCredits(facts);
  const points = tellPoints(signals, credits, visual?.factor ?? 1);
  const score = scoreFromPoints(points);
  const result: AnalysisResult = {
    slug: target.slug,
    methodology: METHODOLOGY,
    url: target.url,
    finalUrl: page.finalUrl,
    score,
    verdict: verdictFor(score),
    signals,
    credits,
    visual,
    rawPoints: rawPoints(signals),
    points,
    rendered: rendered !== null,
    renderedFacts: rendered,
    hasScreenshot: screenshot !== null,
    notes,
    analyzedAt: new Date().toISOString(),
  };
  await saveScan(target.slug, { result, screenshot });
  return result;
};

const analyzeOnce = async (target: Target): Promise<AnalysisResult> => {
  try {
    return await withSlot(() => analyze(target));
  } finally {
    inFlight.delete(target.slug);
  }
};

export const peekScan = (target: Target): Promise<AnalysisResult | null> =>
  loadScan(target.slug);

/** Returns the stored scan when it is fresh, otherwise scans once, however many requests ask at the same time. */
export const getScan = async (
  target: Target,
  { fresh = false } = {}
): Promise<AnalysisResult> => {
  if (!fresh) {
    const stored = await loadScan(target.slug);
    if (stored) {
      return stored;
    }
  }
  const pending = inFlight.get(target.slug);
  if (pending) {
    return pending;
  }
  const job = analyzeOnce(target);
  inFlight.set(target.slug, job);
  return job;
};
