import { createHash } from "node:crypto";

import { env } from "cloudflare:workers";

const SCANS_PER_SITE_PER_DAY = 500;
const SCANS_PER_CLIENT_PER_DAY = 30;
const SITE_SCOPE = "site";

const TAKE_ONE = `INSERT INTO scan_quota (day, scope, used) VALUES (?, ?, 1)
  ON CONFLICT (day, scope) DO UPDATE SET used = used + 1 WHERE used < ?
  RETURNING used`;

export type QuotaRefusal = "client" | "site";

/** The address is hashed with the day, so stored rows can't be matched to a person or across days. */
const clientScope = (day: string, client: string): string =>
  `client:${createHash("sha256").update(`${day}:${client}`).digest("hex").slice(0, 32)}`;

/** Counts one scan against today's quotas. A client over its own quota never touches the site's. */
export const takeDailyScan = async (
  client: string
): Promise<QuotaRefusal | null> => {
  const day = new Date().toISOString().slice(0, 10);
  const [, clientTake] = await env.DB.batch([
    env.DB.prepare("DELETE FROM scan_quota WHERE day < ?").bind(day),
    env.DB.prepare(TAKE_ONE).bind(
      day,
      clientScope(day, client),
      SCANS_PER_CLIENT_PER_DAY
    ),
  ]);
  if (!clientTake?.results.length) {
    return "client";
  }
  const siteTake = await env.DB.prepare(TAKE_ONE)
    .bind(day, SITE_SCOPE, SCANS_PER_SITE_PER_DAY)
    .first();
  return siteTake ? null : "site";
};
