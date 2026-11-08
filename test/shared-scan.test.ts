import { expect, it, vi } from "vitest";

import type { ScanOutcome, ScanRequest } from "@/lib/scan-request.server";
import { createSharedScan } from "@/lib/shared-scan";
import type { AnalysisResult } from "@/lib/types";

const DEADLINE_MS = 120_000;
const report = (slug: string): ScanOutcome => ({
  ok: true,
  result: { slug } as AnalysisResult,
});
const visitor = (ip: string): ScanRequest => ({
  target: {
    slug: "example.com",
    url: "https://example.com/",
    host: "example.com",
  },
  fresh: false,
  ip,
});

const heldAttempt = () => {
  const settles: ((outcome: ScanOutcome) => void)[] = [];
  const attempt = vi.fn(
    (_request: ScanRequest) =>
      // oxlint-disable-next-line promise/avoid-new -- the test decides when the scan ends
      new Promise<ScanOutcome>((resolve) => {
        settles.push(resolve);
      })
  );
  const settle = (index: number, outcome: ScanOutcome) =>
    settles[index]?.(outcome);
  return { attempt, settle };
};

it("gives visitors who arrive during a scan that scan's report, from one attempt", async () => {
  const { attempt, settle } = heldAttempt();
  const joinOrStart = createSharedScan(attempt, DEADLINE_MS);
  const first = joinOrStart(visitor("1.1.1.1"));
  const second = joinOrStart(visitor("2.2.2.2"));
  settle(0, report("example.com"));
  await expect(first).resolves.toEqual(report("example.com"));
  await expect(second).resolves.toEqual(report("example.com"));
  expect(attempt).toHaveBeenCalledOnce();
});

it("starts a new attempt once the last one has ended", async () => {
  const { attempt, settle } = heldAttempt();
  const joinOrStart = createSharedScan(attempt, DEADLINE_MS);
  const first = joinOrStart(visitor("1.1.1.1"));
  settle(0, report("first"));
  await first;
  const second = joinOrStart(visitor("2.2.2.2"));
  settle(1, report("second"));
  await expect(second).resolves.toEqual(report("second"));
  expect(attempt).toHaveBeenCalledTimes(2);
});

it("does not hand one visitor's quota refusal to a visitor who joined", async () => {
  const { attempt, settle } = heldAttempt();
  const joinOrStart = createSharedScan(attempt, DEADLINE_MS);
  const refusal: ScanOutcome = { ok: false, error: "quota", refused: true };
  const first = joinOrStart(visitor("1.1.1.1"));
  const second = joinOrStart(visitor("2.2.2.2"));
  settle(0, refusal);
  await expect(first).resolves.toEqual(refusal);
  await vi.waitFor(() => expect(attempt).toHaveBeenCalledTimes(2));
  expect(attempt).toHaveBeenLastCalledWith(visitor("2.2.2.2"));
  settle(1, report("example.com"));
  await expect(second).resolves.toEqual(report("example.com"));
});

it("gives up on a scan that outlives the deadline and frees the site", async () => {
  vi.useFakeTimers();
  try {
    const { attempt, settle } = heldAttempt();
    const joinOrStart = createSharedScan(attempt, DEADLINE_MS);
    const stuck = joinOrStart(visitor("1.1.1.1"));
    await vi.advanceTimersByTimeAsync(DEADLINE_MS);
    await expect(stuck).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/try again/iu),
    });
    const next = joinOrStart(visitor("2.2.2.2"));
    settle(1, report("example.com"));
    await expect(next).resolves.toEqual(report("example.com"));
  } finally {
    vi.useRealTimers();
  }
});
