import { getRequestHeader } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { BlockedUrlError, clientKey } from "./net-guard";
import { takeDailyScan } from "./quota.server";
import type { QuotaRefusal } from "./quota.server";
import { BrowserUnavailableError } from "./render";
import { peekScan, runScan } from "./scan.server";
import { InvalidTargetError, parseTarget } from "./target";
import type { AnalysisResult } from "./types";

export type ScanOutcome =
  | { ok: true; result: AnalysisResult }
  | { ok: false; error: string };

const QUOTA_REFUSALS: Record<QuotaRefusal, string> = {
  client:
    "You've used today's scans. Existing reports are still here; score a new page tomorrow.",
  site: "Today's scans have run out for everyone. Existing reports are still here; score a new page tomorrow.",
};

/** Why this client can't start a scan right now, or null when it can. */
const scanRefusal = async (ip: string): Promise<string | null> => {
  if (import.meta.env.DEV) {
    return null;
  }
  const key = clientKey(ip);
  const { success } = await env.SCAN_LIMITER.limit({ key });
  if (!success) {
    return "That's a lot of scans in a row. Give it a few minutes.";
  }
  const refusal = await takeDailyScan(key);
  return refusal ? QUOTA_REFUSALS[refusal] : null;
};

const friendlyError = (error: unknown): string => {
  if (error instanceof InvalidTargetError) {
    return error.message;
  }
  const message = error instanceof Error ? error.message : "";
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
  return "Couldn't fetch that page.";
};

/** Stored report when fresh; otherwise a rate-limited scan. Never throws: errors come back as readable text. */
export const requestScan = async (
  slug: string,
  { fresh = false } = {}
): Promise<ScanOutcome> => {
  try {
    const target = parseTarget(slug);
    const stored = fresh ? null : await peekScan(target);
    if (stored) {
      return { ok: true, result: stored };
    }
    const refusal = await scanRefusal(
      getRequestHeader("cf-connecting-ip") ?? "unknown"
    );
    if (refusal) {
      return { ok: false, error: refusal };
    }
    return { ok: true, result: await runScan(target) };
  } catch (error) {
    return { ok: false, error: friendlyError(error) };
  }
};

export const storedScan = async (
  slug: string
): Promise<AnalysisResult | null> => {
  try {
    return await peekScan(parseTarget(slug));
  } catch {
    return null;
  }
};
