import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { METHODOLOGY } from "./signals";
import type { AnalysisResult } from "./types";

const DIR =
  process.env.SCAN_CACHE_DIR ?? path.join(process.cwd(), ".cache", "scans");
export const SCAN_TTL_MS = 24 * 60 * 60 * 1000;

const keyOf = (slug: string) =>
  createHash("sha256").update(slug).digest("hex").slice(0, 32);

export interface StoredScan {
  result: AnalysisResult;
  screenshot: Buffer | null;
}

export const loadScan = async (
  slug: string
): Promise<AnalysisResult | null> => {
  try {
    const result = JSON.parse(
      await readFile(path.join(DIR, `${keyOf(slug)}.json`), "utf-8")
    ) as AnalysisResult;
    const fresh = Date.now() - Date.parse(result.analyzedAt) < SCAN_TTL_MS;
    return fresh && result.methodology === METHODOLOGY ? result : null;
  } catch {
    return null;
  }
};

export const loadScreenshot = async (slug: string): Promise<Buffer | null> => {
  try {
    return await readFile(path.join(DIR, `${keyOf(slug)}.jpg`));
  } catch {
    return null;
  }
};

const writeAtomic = async (
  file: string,
  data: string | Buffer
): Promise<void> => {
  const temp = `${file}.${process.pid}.tmp`;
  await writeFile(temp, data);
  await rename(temp, file);
};

export const saveScan = async (
  slug: string,
  { result, screenshot }: StoredScan
): Promise<void> => {
  await mkdir(DIR, { recursive: true });
  const key = keyOf(slug);
  if (screenshot) {
    await writeAtomic(path.join(DIR, `${key}.jpg`), screenshot);
  }
  await writeAtomic(path.join(DIR, `${key}.json`), JSON.stringify(result));
};

/** The freshest stored scans, newest first, for the home page. */
export const recentScans = async (limit: number): Promise<AnalysisResult[]> => {
  let names: string[];
  try {
    names = await readdir(DIR);
  } catch {
    return [];
  }
  const results = await Promise.all(
    names
      .filter((name) => name.endsWith(".json"))
      .map(async (name) => {
        try {
          return JSON.parse(
            await readFile(path.join(DIR, name), "utf-8")
          ) as AnalysisResult;
        } catch {
          return null;
        }
      })
  );
  return results
    .filter(
      (result): result is AnalysisResult =>
        result !== null &&
        result.methodology === METHODOLOGY &&
        Date.now() - Date.parse(result.analyzedAt) < SCAN_TTL_MS
    )
    .toSorted((a, b) => Date.parse(b.analyzedAt) - Date.parse(a.analyzedAt))
    .slice(0, limit);
};
