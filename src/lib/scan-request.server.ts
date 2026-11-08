import { getRequestIP } from "@tanstack/react-start/server";

import { BlockedUrlError } from "./net-guard";
import { getScan, peekScan } from "./scan.server";
import { InvalidTargetError, parseTarget } from "./target";
import type { AnalysisResult } from "./types";

export type ScanOutcome =
  | { ok: true; result: AnalysisResult }
  | { ok: false; error: string };

const FRESH_SCANS_PER_WINDOW = 8;
const WINDOW_MS = 10 * 60 * 1000;
const freshScans = new Map<string, number[]>();

const allowFreshScan = (ip: string): boolean => {
  if (import.meta.env.DEV) {
    return true;
  }
  const now = Date.now();
  const recent = (freshScans.get(ip) ?? []).filter(
    (at) => now - at < WINDOW_MS
  );
  if (recent.length >= FRESH_SCANS_PER_WINDOW) {
    freshScans.set(ip, recent);
    return false;
  }
  recent.push(now);
  freshScans.set(ip, recent);
  return true;
};

const friendlyError = (error: unknown): string => {
  if (error instanceof InvalidTargetError) {
    return error.message;
  }
  const cause =
    error instanceof Error && error.cause instanceof Error
      ? ` ${error.cause.message} ${(error.cause as NodeJS.ErrnoException).code ?? ""}`
      : "";
  const message = error instanceof Error ? `${error.message}${cause}` : "";
  if (/EBLOCKED|Blocked private/u.test(message)) {
    return "That host resolves to a private address, so it can't be scored.";
  }
  if (/ENOTFOUND|getaddrinfo/u.test(message)) {
    return "That domain doesn't resolve.";
  }
  if (/timeout|aborted/iu.test(message)) {
    return "The site took too long to answer.";
  }
  if (
    error instanceof BlockedUrlError ||
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
    if (!allowFreshScan(getRequestIP({ xForwardedFor: true }) ?? "unknown")) {
      return {
        ok: false,
        error: "That's a lot of scans in a row. Give it a few minutes.",
      };
    }
    return { ok: true, result: await getScan(target, { fresh }) };
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
