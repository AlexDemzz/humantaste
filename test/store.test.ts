import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { SQLInputValue } from "node:sqlite";

import { beforeEach, expect, it, vi } from "vitest";

import {
  loadScan,
  recentScans,
  reportsForSitemap,
  saveScan,
} from "@/lib/store.server";
import type { AnalysisResult } from "@/lib/types";

const MIGRATIONS = new URL("../migrations/", import.meta.url);

const { database } = vi.hoisted(() => ({
  database: { current: null as DatabaseSync | null },
}));

/** Just enough of D1 to run the store's own SQL against the real schema. */
vi.mock("cloudflare:workers", () => {
  const statement = (sql: string, params: SQLInputValue[] = []) => {
    const prepared = () => {
      if (!database.current) {
        throw new Error("No database");
      }
      return database.current.prepare(sql);
    };
    return {
      bind: (...values: SQLInputValue[]) => statement(sql, values),
      first: () => Promise.resolve(prepared().get(...params) ?? null),
      all: () => Promise.resolve({ results: prepared().all(...params) }),
      run: () => Promise.resolve(prepared().run(...params)),
    };
  };
  return { env: { DB: { prepare: (sql: string) => statement(sql) } } };
});

const report = (slug: string, methodology: string, analyzedAt: string) =>
  ({ slug, methodology, score: 80, analyzedAt }) as AnalysisResult;

const save = (result: AnalysisResult) =>
  saveScan(result.slug, { result, screenshot: null });

beforeEach(() => {
  database.current = new DatabaseSync(":memory:");
  for (const file of readdirSync(MIGRATIONS).toSorted()) {
    database.current.exec(readFileSync(new URL(file, MIGRATIONS), "utf-8"));
  }
});

it("keeps showing a report scored under an older methodology", async () => {
  await save(report("old.example", "2026-11-10.1", "2026-11-10T10:00:00Z"));
  await expect(loadScan("old.example")).resolves.toMatchObject({
    methodology: "2026-11-10.1",
  });
});

it("treats a report stored before points became a sum as missing", async () => {
  await save(report("legacy.example", "2026-11-07.10", "2026-11-08T10:00:00Z"));
  await expect(loadScan("legacy.example")).resolves.toBeNull();
});

it("lists readable reports of every methodology, newest first", async () => {
  await save(report("legacy.example", "2026-11-07.10", "2026-11-12T10:00:00Z"));
  await save(report("old.example", "2026-11-10.1", "2026-11-10T10:00:00Z"));
  await save(report("new.example", "2026-11-10.3", "2026-11-11T10:00:00Z"));

  await expect(recentScans(10)).resolves.toEqual([
    { slug: "new.example", score: 80 },
    { slug: "old.example", score: 80 },
  ]);
  const sitemap = await reportsForSitemap(10);
  expect(sitemap.map(({ slug }) => slug)).toEqual([
    "new.example",
    "old.example",
  ]);
});
