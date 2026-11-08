import { env } from "cloudflare:workers";

import { sha256Hex } from "./sha256";

const SCANS_PER_SITE_PER_DAY = 500;
const SCANS_PER_CLIENT_PER_DAY = 30;
const SITE_SCOPE = "site";
const ISO_DAY_LENGTH = 10;
const CLIENT_HASH_LENGTH = 32;

const TAKE_ONE = `INSERT INTO scan_quota (day, scope, used) VALUES (?, ?, 1)
  ON CONFLICT (day, scope) DO UPDATE SET used = used + 1 WHERE used < ?
  RETURNING used`;

const GIVE_BACK_ONE =
  "UPDATE scan_quota SET used = used - 1 WHERE day = ? AND scope = ? AND used > 0";

export type QuotaRefusal = "client" | "site";

export type DailyReservation =
  | { ok: true; release: () => Promise<void> }
  | { ok: false; refusedBy: QuotaRefusal };

/** The address is hashed with the day, so stored rows don't hold it in the clear. Unsalted, so this is not anonymisation. */
const clientScope = (day: string, client: string): string =>
  `client:${sha256Hex(`${day}:${client}`).slice(0, CLIENT_HASH_LENGTH)}`;

const giveBackOne = (day: string, scope: string): D1PreparedStatement =>
  env.DB.prepare(GIVE_BACK_ONE).bind(day, scope);

/** Holds one scan against today's quotas. A client over its own quota never touches the site's. */
export const reserveDailyScan = async (
  client: string
): Promise<DailyReservation> => {
  const day = new Date().toISOString().slice(0, ISO_DAY_LENGTH);
  const scope = clientScope(day, client);
  const [, clientTake] = await env.DB.batch([
    env.DB.prepare("DELETE FROM scan_quota WHERE day < ?").bind(day),
    env.DB.prepare(TAKE_ONE).bind(day, scope, SCANS_PER_CLIENT_PER_DAY),
  ]);
  if (!clientTake?.results.length) {
    return { ok: false, refusedBy: "client" };
  }
  const siteTake = await env.DB.prepare(TAKE_ONE)
    .bind(day, SITE_SCOPE, SCANS_PER_SITE_PER_DAY)
    .first();
  if (!siteTake) {
    await giveBackOne(day, scope).run();
    return { ok: false, refusedBy: "site" };
  }
  return {
    ok: true,
    release: async () => {
      await env.DB.batch([
        giveBackOne(day, scope),
        giveBackOne(day, SITE_SCOPE),
      ]);
    },
  };
};
