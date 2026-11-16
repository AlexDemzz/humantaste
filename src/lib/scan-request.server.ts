import { getRequestHeader } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { loadScan } from "./store.server";
import { InvalidTargetError, parseTarget } from "./target";
import type { Target } from "./target";
import type { AnalysisResult } from "./types";

export type ScanOutcome =
  | { ok: true; result: AnalysisResult }
  /** `refused` marks a limit on this visitor, which says nothing about anyone else waiting on the same scan. */
  | { ok: false; error: string; refused?: true };

export interface ScanRequest {
  target: Target;
  fresh: boolean;
  ip: string;
}

const SCAN_INTERRUPTED = "Scoring was interrupted. Try again in a minute.";
const UNREADABLE =
  "The site didn't let our browser open the page, so there is no score. Try again in a minute.";

/** Most patterns are measured on the rendered page: the static checks alone would pass almost any site, so they give no score. */
export const withoutUnrendered = (outcome: ScanOutcome): ScanOutcome =>
  outcome.ok && !outcome.result.rendered
    ? { ok: false, error: UNREADABLE }
    : outcome;

/** The stored report without waiting on any rescan, else the site's one running scan. Never throws: errors come back as readable text. */
export const requestScan = async (
  slug: string,
  {
    fresh = false,
    ip = getRequestHeader("cf-connecting-ip") ?? "unknown",
  }: { fresh?: boolean; ip?: string } = {}
): Promise<ScanOutcome> => {
  try {
    const target = parseTarget(slug);
    const stored = fresh ? null : await loadScan(target.slug);
    if (stored) {
      return { ok: true, result: stored };
    }
    return withoutUnrendered(
      await env.SITE_SCAN.getByName(target.slug).scan({
        target,
        fresh,
        ip,
      })
    );
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof InvalidTargetError ? error.message : SCAN_INTERRUPTED,
    };
  }
};

export const storedScan = async (
  slug: string
): Promise<AnalysisResult | null> => {
  try {
    return await loadScan(parseTarget(slug).slug);
  } catch {
    return null;
  }
};
