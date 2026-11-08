import { env } from "cloudflare:workers";

const LEASE_MS = 90_000;

const TAKE_LEASE = `INSERT INTO scan_leases (slug, expires_at) VALUES (?, ?)
  ON CONFLICT (slug) DO UPDATE SET expires_at = excluded.expires_at WHERE expires_at < ?
  RETURNING slug`;

/** Matching on expires_at keeps a scan that outlived its lease from freeing the next holder's. */
const RELEASE_LEASE =
  "DELETE FROM scan_leases WHERE slug = ? AND expires_at = ?";

export interface ScanLease {
  release: () => Promise<void>;
}

/** Null while another request is scoring this site. */
export const takeScanLease = async (
  slug: string
): Promise<ScanLease | null> => {
  const now = Date.now();
  const expiresAt = now + LEASE_MS;
  const taken = await env.DB.prepare(TAKE_LEASE)
    .bind(slug, expiresAt, now)
    .first();
  if (!taken) {
    return null;
  }
  return {
    release: async () => {
      await env.DB.prepare(RELEASE_LEASE).bind(slug, expiresAt).run();
    },
  };
};
