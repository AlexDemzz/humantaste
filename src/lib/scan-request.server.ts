import { getRequestHeader } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { clientKey } from "./client-key";
import { errorMessage } from "./errors";
import { BlockedUrlError } from "./net-guard";
import { reserveDailyScan } from "./quota.server";
import type { QuotaRefusal } from "./quota.server";
import { BrowserUnavailableError } from "./render";
import { takeScanLease } from "./scan-lease.server";
import { runScan } from "./scan.server";
import { loadScan } from "./store.server";
import { InvalidTargetError, parseTarget } from "./target";
import type { Target } from "./target";
import type { AnalysisResult } from "./types";

export type ScanOutcome =
  | { ok: true; result: AnalysisResult }
  | { ok: false; error: string };

const QUOTA_REFUSALS: Record<QuotaRefusal, string> = {
  client:
    "You've scored as many pages as you can today. Existing reports are still here; score a new page tomorrow.",
  site: "Everyone has scored as many pages as we can take today. Existing reports are still here; score a new page tomorrow.",
};

const SCORING_IN_PROGRESS =
  "This page is being scored right now. Reload in a minute to see its report.";

type ScanAdmission =
  | { ok: true; release: () => Promise<void> }
  | { ok: false; error: string };

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
    };
  }
  const reservation = await reserveDailyScan(key);
  return reservation.ok
    ? reservation
    : { ok: false, error: QUOTA_REFUSALS[reservation.refusedBy] };
};

/** A failed give-back must not replace the visitor's report or the scan's own error; leases expire and quotas reset. */
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

const scanWithinQuota = async (target: Target): Promise<ScanOutcome> => {
  const admission = await admitScan(
    getRequestHeader("cf-connecting-ip") ?? "unknown"
  );
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

/** The stored report unless a fresh scan is asked for; otherwise one leased, quota-limited scan. Never throws: errors come back as readable text. */
export const requestScan = async (
  slug: string,
  { fresh = false } = {}
): Promise<ScanOutcome> => {
  try {
    const target = parseTarget(slug);
    const stored = fresh ? null : await loadScan(target.slug);
    if (stored) {
      return { ok: true, result: stored };
    }
    const lease = await takeScanLease(target.slug);
    if (!lease) {
      return { ok: false, error: SCORING_IN_PROGRESS };
    }
    try {
      return await scanWithinQuota(target);
    } finally {
      await giveBack("lease", lease.release);
    }
  } catch (error) {
    return { ok: false, error: friendlyError(error) };
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
