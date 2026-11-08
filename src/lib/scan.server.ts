import { extractStatic } from "./extract";
import { fetchPage, inlineStyles, SiteRefusedError } from "./fetch-page";
import type { FetchedPage } from "./fetch-page";
import { visualRead } from "./judge.server";
import { BrowserUnavailableError, renderPage } from "./render";
import type { RenderOutput } from "./render";
import { scoreFromPoints, verdictFor } from "./score";
import {
  evaluateCredits,
  evaluateSignals,
  METHODOLOGY,
  rawPoints,
  tellPoints,
} from "./signals";
import { loadScan, loadVisual, saveScan, shotHash } from "./store.server";
import type { Target } from "./target";
import type { AnalysisResult, VisualRead } from "./types";

/** Bot shields often refuse a Worker's request but let a real browser through. */
const fetchUnlessRefused = async (
  url: string
): Promise<FetchedPage | SiteRefusedError> => {
  try {
    return await fetchPage(url);
  } catch (error) {
    if (error instanceof SiteRefusedError) {
      return error;
    }
    throw error;
  }
};

interface PageSource {
  finalUrl: string;
  html: string;
  css: string[];
}

/** The fetched page when the site served it, else what the browser loaded. */
const readSource = (
  page: FetchedPage | null,
  render: RenderOutput | null,
  notes: string[]
): PageSource | null => {
  if (page) {
    return {
      finalUrl: page.finalUrl,
      html: render?.html ?? page.html,
      css: page.css.map((sheet) => sheet.text),
    };
  }
  if (!render) {
    return null;
  }
  notes.push(
    "The site refused a direct request, so the HTML and CSS were read from the rendered page."
  );
  return {
    finalUrl: render.finalUrl,
    html: render.html,
    css: [...render.stylesheets, ...inlineStyles(render.html)].map(
      (sheet) => sheet.text
    ),
  };
};

/** The page rendered byte for byte the same: the previous Jev read still holds, and costs no second call. */
const readVisual = async (
  shot: { slug: string; screenshot: Buffer; screenshotHash: string },
  url: string,
  notes: string[]
): Promise<VisualRead | null> => {
  try {
    const reused = await loadVisual(shot.slug, shot.screenshotHash);
    return reused ?? (await visualRead(shot.screenshot, url));
  } catch (error) {
    notes.push(
      `The visual read failed (${error instanceof Error ? error.message : "unknown error"}), so tell points are unweighted.`
    );
    return null;
  }
};

export const runScan = async (target: Target): Promise<AnalysisResult> => {
  const fetched = await fetchUnlessRefused(target.url);
  const page = fetched instanceof SiteRefusedError ? null : fetched;
  const notes = page ? [...page.notes] : [];

  let render: RenderOutput | null = null;
  try {
    render = await renderPage(page?.finalUrl ?? target.url);
  } catch (error) {
    if (error instanceof BrowserUnavailableError) {
      throw error;
    }
    notes.push(
      `Rendering failed (${error instanceof Error ? error.message.split("\n")[0] : "unknown error"}), so layout checks were skipped.`
    );
  }

  const source = readSource(page, render, notes);
  if (!source) {
    throw fetched;
  }
  const rendered = render?.facts ?? null;
  const screenshot = render?.screenshot ?? null;

  const screenshotHash = screenshot ? shotHash(screenshot) : null;
  const visual =
    screenshot && screenshotHash
      ? await readVisual(
          { slug: target.slug, screenshot, screenshotHash },
          source.finalUrl,
          notes
        )
      : null;

  const facts = {
    url: source.finalUrl,
    static: extractStatic(source.html, source.css),
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
    finalUrl: source.finalUrl,
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
  await saveScan(target.slug, { result, screenshot, screenshotHash });
  return result;
};

export const peekScan = (target: Target): Promise<AnalysisResult | null> =>
  loadScan(target.slug);
