import { getRequestHeader } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { clientKey } from "./client-key";
import { errorMessage } from "./errors";
import { BlockedUrlError } from "./net-guard";
import { reserveDailyScan } from "./quota.server";
import type { QuotaRefusal } from "./quota.server";
import { BrowserUnavailableError } from "./render";
import { runScan } from "./scan.server";
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

const QUOTA_REFUSALS: Record<QuotaRefusal, string> = {
  client:
    "You've scored as many pages as you can today. Existing reports are still here; score a new page tomorrow.",
  site: "Everyone has scored as many pages as we can take today. Existing reports are still here; score a new page tomorrow.",
};

const SCAN_INTERRUPTED = "Scoring was interrupted. Try again in a minute.";
const UNREADABLE =
  "The site didn't let our browser open the page, so there is no score. Try again in a minute.";

/** Most patterns are measured on the rendered page: the static checks alone would pass almost any site, so they give no score. */
export const withoutUnrendered = (outcome: ScanOutcome): ScanOutcome =>
  outcome.ok && !outcome.result.rendered
    ? { ok: false, error: UNREADABLE }
    : outcome;

type ScanAdmission =
  | { ok: true; release: () => Promise<void> }
  | { ok: false; error: string; refused: true };

const admitScan = async (ip: string): Promise<ScanAdmission> => {
  if (import.meta.env.DEV) {
    return { ok: true, release: () => Promise.resolve() };
  }
  const key = clientKey(ip);
  const { success } = await env.SCAN_LIMITER.limit({ key });
  if (!success) {
    return {
      ok: false,
      error: "That's a lot of pages in a row. Give it a few minutes.",
      refused: true,
    };
  }
  const reservation = await reserveDailyScan(key);
  return reservation.ok
    ? reservation
    : {
        ok: false,
        error: QUOTA_REFUSALS[reservation.refusedBy],
        refused: true,
      };
};

/** A failed give-back must not replace the visitor's report or the scan's own error; quotas reset. */
const giveBack = async (
  what: string,
  release: () => Promise<void>
): Promise<void> => {
  try {
    await release();
  } catch (error) {
    console.error(
      JSON.stringify({
        message: `${what} give-back failed`,
        error: errorMessage(error),
      })
    );
  }
};

const friendlyError = (error: unknown): string => {
  if (error instanceof InvalidTargetError) {
    return error.message;
  }
  const message = errorMessage(error, "");
  if (/timeout|aborted/iu.test(message)) {
    return "The site took too long to answer.";
  }
  if (
    error instanceof BlockedUrlError ||
    error instanceof BrowserUnavailableError ||
    /answered|redirect|HTML page/iu.test(message)
  ) {
    return message;
  }
  return "Couldn't fetch that page. Check the address and try again.";
};

const scanWithinQuota = async (
  target: Target,
  ip: string
): Promise<ScanOutcome> => {
  const admission = await admitScan(ip);
  if (!admission.ok) {
    return admission;
  }
  try {
    return { ok: true, result: await runScan(target) };
  } catch (error) {
    await giveBack("quota", admission.release);
    throw error;
  }
};

/** Runs inside the site's Durable Object, where the store is read again: a scan may have ended since the visitor asked. */
export const attemptScan = async ({
  target,
  fresh,
  ip,
}: ScanRequest): Promise<ScanOutcome> => {
  try {
    const stored = fresh ? null : await loadScan(target.slug);
    if (stored) {
      return { ok: true, result: stored };
    }
    return await scanWithinQuota(target, ip);
  } catch (error) {
    return { ok: false, error: friendlyError(error) };
  }
};

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
