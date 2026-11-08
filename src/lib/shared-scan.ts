import { withinDeadline } from "./deadline";
import type { ScanOutcome, ScanRequest } from "./scan-request.server";

const TOO_LONG: ScanOutcome = {
  ok: false,
  error: "The site took too long to answer. Try again in a minute.",
};

/**
 * One attempt at a time: whoever arrives while it runs waits for its outcome. `running` is set before the first await,
 * so two arrivals can never both start one. The deadline keeps a stuck attempt from holding the site forever.
 */
export const createSharedScan = (
  attempt: (request: ScanRequest) => Promise<ScanOutcome>,
  deadlineMs: number
): ((request: ScanRequest) => Promise<ScanOutcome>) => {
  let running: Promise<ScanOutcome> | null = null;
  const start = async (request: ScanRequest): Promise<ScanOutcome> => {
    try {
      return await withinDeadline(
        attempt(request),
        deadlineMs,
        "scan deadline passed"
      );
    } catch {
      return TOO_LONG;
    } finally {
      running = null;
    }
  };
  const joinOrStart = async (request: ScanRequest): Promise<ScanOutcome> => {
    const joined = running !== null;
    running ??= start(request);
    const outcome = await running;
    const refusedSomeoneElse = joined && !outcome.ok && outcome.refused;
    return refusedSomeoneElse ? joinOrStart(request) : outcome;
  };
  return joinOrStart;
};
