import { errorMessage } from "./errors";
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
import { hashScreenshot, loadVisual, saveScan } from "./store.server";
import type { Screenshot } from "./store.server";
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

const FIRST_REFUSED_STATUS = 400;

type RenderAttempt =
  | { render: RenderOutput; failure: null }
  | { render: null; failure: string };

/** A challenge or error page is not the site: it counts as a failed render. Only a missing browser fails the scan. */
const attemptRender = async (url: string): Promise<RenderAttempt> => {
  try {
    const render = await renderPage(url);
    if (render.documentStatus === null) {
      return { render: null, failure: "no document came back" };
    }
    if (render.documentStatus >= FIRST_REFUSED_STATUS) {
      return {
        render: null,
        failure: `the page answered ${render.documentStatus}`,
      };
    }
    return { render, failure: null };
  } catch (error) {
    if (error instanceof BrowserUnavailableError) {
      throw error;
    }
    const [firstLine = ""] = errorMessage(error).split("\n");
    return { render: null, failure: firstLine };
  }
};

/** The fetched page when the site served it, else what the browser loaded. Throws the refusal when there is neither. */
const readSource = (
  fetched: FetchedPage | SiteRefusedError,
  render: RenderOutput | null
): { source: PageSource; note: string | null } => {
  if (!(fetched instanceof SiteRefusedError)) {
    return {
      source: {
        finalUrl: fetched.finalUrl,
        html: render?.html ?? fetched.html,
        css: fetched.css.map((sheet) => sheet.text),
      },
      note: null,
    };
  }
  if (!render) {
    throw fetched;
  }
  return {
    source: {
      finalUrl: render.finalUrl,
      html: render.html,
      css: [...render.stylesheets, ...inlineStyles(render.html)].map(
        (sheet) => sheet.text
      ),
    },
    note: "The site refused a direct request, so the HTML and CSS were read from the rendered page.",
  };
};

interface VisualAttempt {
  visual: VisualRead | null;
  failure: string | null;
}

const NO_VISUAL: VisualAttempt = { visual: null, failure: null };

/** The page rendered byte for byte the same: the previous Jev read still holds, and costs no second call. */
const reuseOrRequestVisual = async (
  slug: string,
  screenshot: Screenshot,
  url: string
): Promise<VisualAttempt> => {
  try {
    const reused = await loadVisual(slug, screenshot.hash);
    return {
      visual: reused ?? (await visualRead(screenshot.bytes, url)),
      failure: null,
    };
  } catch (error) {
    return { visual: null, failure: errorMessage(error) };
  }
};

export const runScan = async (target: Target): Promise<AnalysisResult> => {
  const fetched = await fetchUnlessRefused(target.url);
  const page = fetched instanceof SiteRefusedError ? null : fetched;
  const notes = page ? [...page.notes] : [];

  const { render, failure: renderFailure } = await attemptRender(
    page?.finalUrl ?? target.url
  );
  if (renderFailure !== null) {
    notes.push(
      `Rendering failed (${renderFailure}), so layout checks were skipped.`
    );
  }

  const { source, note } = readSource(fetched, render);
  if (note) {
    notes.push(note);
  }
  const rendered = render?.facts ?? null;
  const screenshot: Screenshot | null = render
    ? { bytes: render.screenshot, hash: hashScreenshot(render.screenshot) }
    : null;

  const { visual, failure: visualFailure } = screenshot
    ? await reuseOrRequestVisual(target.slug, screenshot, source.finalUrl)
    : NO_VISUAL;
  if (visualFailure !== null) {
    notes.push(
      `The visual read failed (${visualFailure}), so tell points are unweighted.`
    );
  }
  const degraded = renderFailure !== null || visualFailure !== null;

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
    hasScreenshot: screenshot !== null && !degraded,
    degraded,
    notes,
    analyzedAt: new Date().toISOString(),
  };
  if (!degraded) {
    await saveScan(target.slug, { result, screenshot });
  }
  return result;
};
