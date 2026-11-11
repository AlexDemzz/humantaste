import { env } from "cloudflare:workers";

import { sha256Hex } from "./sha256";
import { METHODOLOGY } from "./signals";
import type { AnalysisResult, VisualRead } from "./types";

export interface Screenshot {
  bytes: Buffer;
  hash: string;
}

export interface StoredScan {
  result: AnalysisResult;
  screenshot: Screenshot | null;
}

export interface RecentScan {
  slug: string;
  score: number;
}

/** Reports scored before this one store points in another shape, so they read as missing and get scored again. */
const OLDEST_READABLE_METHODOLOGY = "2026-11-10.1";

const shotKey = (slug: string) => `shots/${encodeURIComponent(slug)}.jpg`;

/** A site's latest scan, even under an older methodology: "Score again" brings it up to date. */
export const loadScan = async (
  slug: string
): Promise<AnalysisResult | null> => {
  const row = await env.DB.prepare(
    "SELECT result FROM scans WHERE slug = ? AND methodology >= ?"
  )
    .bind(slug, OLDEST_READABLE_METHODOLOGY)
    .first<{ result: string }>();
  if (!row) {
    return null;
  }
  return JSON.parse(row.result) as AnalysisResult;
};

export const hashScreenshot = (screenshot: Uint8Array): string =>
  sha256Hex(screenshot);

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
  { result, screenshot }: StoredScan
): Promise<void> => {
  if (screenshot) {
    await env.SHOTS.put(shotKey(slug), screenshot.bytes, {
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
      screenshot?.hash ?? null
    )
    .run();
};

export const reportsForSitemap = async (
  limit: number
): Promise<{ slug: string; analyzedAt: string }[]> => {
  const { results } = await env.DB.prepare(
    "SELECT slug, analyzed_at AS analyzedAt FROM scans WHERE methodology >= ? ORDER BY analyzed_at DESC LIMIT ?"
  )
    .bind(OLDEST_READABLE_METHODOLOGY, limit)
    .all<{ slug: string; analyzedAt: string }>();
  return results;
};

export const recentScans = async (limit: number): Promise<RecentScan[]> => {
  const { results } = await env.DB.prepare(
    "SELECT slug, score FROM scans WHERE methodology >= ? ORDER BY analyzed_at DESC LIMIT ?"
  )
    .bind(OLDEST_READABLE_METHODOLOGY, limit)
    .all<RecentScan>();
  return results;
};
