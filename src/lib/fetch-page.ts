import * as cheerio from "cheerio";

import {
  assertResolvesPublic,
  assertSafeUrl,
  BlockedUrlError,
} from "./net-guard";

const HTML_LIMIT = 3 * 1024 * 1024;
export const CSS_LIMIT = 2 * 1024 * 1024;
export const MAX_STYLESHEETS = 12;
/** Answers a bot shield gives a Worker's request while a real browser still gets the page. */
const REFUSAL_STATUSES = new Set([401, 403, 429, 503]);
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 8000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0 Safari/537.36 humantaste/0.1";

const readLimited = async (
  body: ReadableStream<Uint8Array> | null,
  limit: number
): Promise<{ text: string; truncated: boolean }> => {
  if (!body) {
    return { text: "", truncated: false };
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;
  /* oxlint-disable no-await-in-loop -- a stream yields its chunks one after another */
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    size += value.byteLength;
    if (size > limit) {
      chunks.push(value.subarray(0, value.byteLength - (size - limit)));
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  /* oxlint-enable no-await-in-loop */
  return { text: Buffer.concat(chunks).toString("utf-8"), truncated };
};

export class SiteRefusedError extends Error {
  override name = "SiteRefusedError";
}

export interface Stylesheet {
  href: string;
  text: string;
}

export const inlineStyles = (html: string): Stylesheet[] => {
  const $ = cheerio.load(html);
  return $("style")
    .map((index, el) => ({
      href: `inline <style> #${index + 1}`,
      text: $(el).text(),
    }))
    .get();
};

export const safeGet = async (
  rawUrl: string,
  limit: number,
  accept: string
): Promise<{
  url: string;
  text: string;
  contentType: string;
  truncated: boolean;
}> => {
  let current = assertSafeUrl(rawUrl);
  /* oxlint-disable no-await-in-loop -- each redirect hop needs the previous response's location */
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertResolvesPublic(current.hostname);
    const res = await fetch(current, {
      redirect: "manual",
      headers: { "user-agent": USER_AGENT, accept, "accept-language": "en" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      await res.body?.cancel();
      if (!location) {
        throw new Error(`Redirect without a location (${res.status}).`);
      }
      current = assertSafeUrl(new URL(location, current).toString());
      continue;
    }
    if (!res.ok) {
      await res.body?.cancel();
      const message = `The site answered ${res.status}.`;
      throw REFUSAL_STATUSES.has(res.status)
        ? new SiteRefusedError(message)
        : new Error(message);
    }
    const { text, truncated } = await readLimited(res.body, limit);
    return {
      url: current.toString(),
      text,
      contentType: res.headers.get("content-type") ?? "",
      truncated,
    };
  }
  /* oxlint-enable no-await-in-loop */
  throw new Error("Too many redirects.");
};

export interface FetchedPage {
  finalUrl: string;
  html: string;
  css: Stylesheet[];
  notes: string[];
}

export const fetchPage = async (rawUrl: string): Promise<FetchedPage> => {
  const notes: string[] = [];
  const page = await safeGet(
    rawUrl,
    HTML_LIMIT,
    "text/html,application/xhtml+xml"
  );
  if (!page.contentType.includes("html")) {
    throw new BlockedUrlError(
      `That URL serves ${page.contentType || "something"} rather than an HTML page.`
    );
  }
  if (page.truncated) {
    notes.push("HTML was over 3 MB and got cut off.");
  }
  const $ = cheerio.load(page.text);
  const hrefs = $('link[rel~="stylesheet"][href]')
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter((href): href is string => Boolean(href))
    .map((href) => {
      try {
        return new URL(href, page.url).toString();
      } catch {
        return null;
      }
    })
    .filter((href): href is string => href !== null);
  const unique = [...new Set(hrefs)];
  if (unique.length > MAX_STYLESHEETS) {
    notes.push(
      `Read the first ${MAX_STYLESHEETS} of ${unique.length} stylesheets.`
    );
  }
  const css = await Promise.all(
    unique.slice(0, MAX_STYLESHEETS).map(async (href) => {
      try {
        const sheet = await safeGet(href, CSS_LIMIT, "text/css,*/*;q=0.1");
        return { href, text: sheet.text };
      } catch {
        notes.push(`Couldn't load ${href}.`);
        return { href, text: "" };
      }
    })
  );
  return {
    finalUrl: page.url,
    html: page.text,
    css: [...css, ...inlineStyles(page.text)],
    notes,
  };
};
