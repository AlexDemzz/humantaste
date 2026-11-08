import { createServerFn } from "@tanstack/react-start";

import type { ScanOutcome } from "./scan-request.server";
import type { AnalysisResult } from "./types";

export type { ScanOutcome } from "./scan-request.server";

export const peekScanFn = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data }): Promise<AnalysisResult | null> => {
    const { storedScan } = await import("./scan-request.server");
    return storedScan(data);
  });

export const runScanFn = createServerFn({ method: "POST" })
  .validator((input: { slug: string; fresh?: boolean }) => input)
  .handler(async ({ data }): Promise<ScanOutcome> => {
    const { requestScan } = await import("./scan-request.server");
    return requestScan(data.slug, { fresh: data.fresh });
  });

export interface RecentScan {
  slug: string;
  score: number;
}

export const recentScansFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<RecentScan[]> => {
    const { recentScans } = await import("./store.server");
    const scans = await recentScans(12);
    return scans.map(({ slug, score }) => ({ slug, score }));
  }
);
