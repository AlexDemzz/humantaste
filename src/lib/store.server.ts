import { createHash } from "node:crypto";

import { env } from "cloudflare:workers";

import { METHODOLOGY } from "./signals";
import type { AnalysisResult, VisualRead } from "./types";

export interface StoredScan {
  result: AnalysisResult;
  screenshot: Uint8Array | null;
  screenshotHash: string | null;
}

export interface RecentScan {
  slug: string;
  score: number;
}

const shotKey = (slug: string) => `shots/${encodeURIComponent(slug)}.jpg`;

/** A site's latest scan. One scored under an older methodology counts as missing, so the page offers a new scan. */
export const loadScan = async (
  slug: string
): Promise<AnalysisResult | null> => {
  const row = await env.DB.prepare(
    "SELECT result FROM scans WHERE slug = ? AND methodology = ?"
  )
    .bind(slug, METHODOLOGY)
    .first<{ result: string }>();
  return row ? (JSON.parse(row.result) as AnalysisResult) : null;
};

export const shotHash = (screenshot: Uint8Array): string =>
  createHash("sha256").update(screenshot).digest("hex");

export const loadVisual = async (
  slug: string,
  screenshotHash: string
): Promise<VisualRead | null> => {
  const row = await env.DB.prepare(
    "SELECT json_extract(result, '$.visual') AS visual FROM scans WHERE slug = ? AND methodology = ? AND shot_hash = ?"
  )
    .bind(slug, METHODOLOGY, screenshotHash)
    .first<{ visual: string | null }>();
  return row?.visual ? (JSON.parse(row.visual) as VisualRead) : null;
};

export const loadScreenshot = async (
  slug: string
): Promise<ReadableStream | null> => {
  const object = await env.SHOTS.get(shotKey(slug));
  return object?.body ?? null;
};

/** Replaces the site's previous scan: only "Score again" calls for a new one. */
export const saveScan = async (
  slug: string,
  { result, screenshot, screenshotHash }: StoredScan
): Promise<void> => {
  if (screenshot) {
    await env.SHOTS.put(shotKey(slug), screenshot, {
      httpMetadata: { contentType: "image/jpeg" },
    });
  }
  await env.DB.prepare(
    `INSERT INTO scans (slug, methodology, score, analyzed_at, result, shot_hash)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (slug) DO UPDATE SET
       methodology = excluded.methodology,
       score = excluded.score,
       analyzed_at = excluded.analyzed_at,
       result = excluded.result,
       shot_hash = excluded.shot_hash`
  )
    .bind(
      slug,
      result.methodology,
      result.score,
      result.analyzedAt,
      JSON.stringify(result),
      screenshotHash
    )
    .run();
};

/** The latest scans under the current methodology, newest first, for the home page. */
export const recentScans = async (limit: number): Promise<RecentScan[]> => {
  const { results } = await env.DB.prepare(
    "SELECT slug, score FROM scans WHERE methodology = ? ORDER BY analyzed_at DESC LIMIT ?"
  )
    .bind(METHODOLOGY, limit)
    .all<RecentScan>();
  return results;
};
