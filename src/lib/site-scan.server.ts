import { DurableObject } from "cloudflare:workers";

import { attemptScan } from "./scan-request.server";
import type { ScanOutcome, ScanRequest } from "./scan-request.server";
import { createSharedScan } from "./shared-scan";

/** Past the time limits inside a scan added together, so only a stuck one reaches it. */
const SCAN_DEADLINE_MS = 150_000;

/** One object per site, so every visitor of that site waits on the same scan. */
export class SiteScan extends DurableObject<Env> {
  readonly #joinOrStart = createSharedScan(attemptScan, SCAN_DEADLINE_MS);

  /** `waitUntil` lets the scan finish and store its report after the visitor who started it has left. */
  scan(request: ScanRequest): Promise<ScanOutcome> {
    const outcome = this.#joinOrStart(request);
    this.ctx.waitUntil(outcome);
    return outcome;
  }
}
