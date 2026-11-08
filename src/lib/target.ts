/**
 * A scan target is the clean path segment after /scan/: a host, optionally with a path.
 * "https://www.Vercel.com/" and "vercel.com" both become "vercel.com".
 */
export interface Target {
  /** What goes in the URL: `alexandrejoly.me`, `example.com/pricing`. */
  slug: string;
  /** What gets fetched. */
  url: string;
  host: string;
}

const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//iu;
const MAX_SLUG = 300;

export class InvalidTargetError extends Error {
  override name = "InvalidTargetError";
}

export const parseTarget = (raw: string): Target => {
  const trimmed = decodeURIComponent(raw.trim());
  if (trimmed.length === 0 || trimmed.length > MAX_SLUG) {
    throw new InvalidTargetError(
      "Enter a web address to score, like linear.app."
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new InvalidTargetError("Enter a web address, like linear.app.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new InvalidTargetError(
      "Enter an http or https address, like https://linear.app."
    );
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./u, "");
  if (!host.includes(".")) {
    throw new InvalidTargetError(
      "Enter a public web address, like linear.app."
    );
  }
  const path = parsed.pathname.replace(/\/+$/u, "");
  const slug = `${host}${parsed.port ? `:${parsed.port}` : ""}${path}${parsed.search}`;
  return { slug, url: `https://${slug}`, host };
};
