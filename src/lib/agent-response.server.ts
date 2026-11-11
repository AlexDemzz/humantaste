import { waitUntil } from "cloudflare:workers";

import { prefersMarkdown } from "./accept";
import { isInfoPageSlug } from "./info-pages";
import {
  homeMarkdown,
  infoPageMarkdown,
  llmsTxt,
  missingReportMarkdown,
  reportMarkdown,
  scoringReportMarkdown,
} from "./markdown";
import { requestScan } from "./scan-request.server";
import { HOME_MARKDOWN_PATH, absolute } from "./seo";
import { reportUrl } from "./share";
import { loadScan, recentScans } from "./store.server";
import { parseTarget } from "./target";

const READ_METHODS = new Set(["GET", "HEAD"]);
const RECENT_REPORTS = 12;
const SCORING_RETRY_AFTER_SECONDS = 60;
// `/scan/example.md` is a site in Moldova, so a report's Markdown lives under its own prefix.
const REPORT_MARKDOWN = /^\/md\/(?<site>.+)\.md$/u;
const REPORT_PAGE = /^\/scan\/(?<site>.+)$/u;
const MARKDOWN_EXTENSION = /\.md$/u;

const textResponse = (
  request: Request,
  body: string,
  {
    canonical,
    contentType,
    retryAfter,
    status = 200,
  }: {
    canonical?: string;
    contentType: string;
    retryAfter?: number;
    status?: number;
  }
) =>
  new Response(request.method === "HEAD" ? null : body, {
    headers: {
      "content-type": contentType,
      vary: "Accept",
      ...(canonical && { link: `<${canonical}>; rel="canonical"` }),
      ...(retryAfter !== undefined && { "retry-after": String(retryAfter) }),
    },
    status,
  });

const markdownResponse = (
  request: Request,
  body: string,
  options: { canonical?: string; retryAfter?: number; status?: number }
) =>
  textResponse(request, body, {
    ...options,
    contentType: "text/markdown; charset=utf-8",
  });

/** Only these pages have a Markdown twin to negotiate, so only they depend on `Accept`. */
const negotiatesMarkdown = (pathname: string) =>
  pathname === "/" ||
  isInfoPageSlug(pathname.slice(1)) ||
  REPORT_PAGE.test(pathname);

const parsedSlug = (site: string) => {
  try {
    return parseTarget(site).slug;
  } catch {
    return null;
  }
};

const reportResponse = async (request: Request, site: string) => {
  const slug = parsedSlug(site);
  const report = slug ? await loadScan(slug) : null;
  if (slug && report) {
    return markdownResponse(request, reportMarkdown(report), {
      canonical: reportUrl(slug),
    });
  }
  if (!slug) {
    return markdownResponse(request, missingReportMarkdown(site), {
      status: 404,
    });
  }
  // The scan outlives this answer, so the agent finds the report when it asks again.
  waitUntil(
    requestScan(slug, {
      ip: request.headers.get("cf-connecting-ip") ?? "unknown",
    })
  );
  return markdownResponse(request, scoringReportMarkdown(slug), {
    retryAfter: SCORING_RETRY_AFTER_SECONDS,
    status: 202,
  });
};

/** The answer for agents: `/llms.txt` and the Markdown twins, canonical to the HTML pages. `undefined` lets the app render HTML. */
export const agentResponse = async (
  request: Request
): Promise<Response | undefined> => {
  if (!READ_METHODS.has(request.method)) {
    return undefined;
  }
  const { pathname } = new URL(request.url);
  if (pathname === "/llms.txt") {
    return textResponse(request, llmsTxt(), {
      contentType: "text/plain; charset=utf-8",
    });
  }
  const askedMarkdown = prefersMarkdown(request.headers.get("accept"));
  if (pathname === HOME_MARKDOWN_PATH || (pathname === "/" && askedMarkdown)) {
    return markdownResponse(
      request,
      homeMarkdown(await recentScans(RECENT_REPORTS)),
      { canonical: absolute("/") }
    );
  }
  const infoSlug = pathname.slice(1).replace(MARKDOWN_EXTENSION, "");
  if (isInfoPageSlug(infoSlug) && (askedMarkdown || pathname.endsWith(".md"))) {
    return markdownResponse(request, infoPageMarkdown(infoSlug), {
      canonical: absolute(`/${infoSlug}`),
    });
  }
  const site =
    REPORT_MARKDOWN.exec(pathname)?.groups?.site ??
    (askedMarkdown ? REPORT_PAGE.exec(pathname)?.groups?.site : undefined);
  return site ? reportResponse(request, site) : undefined;
};

export const withVaryAccept = (
  pathname: string,
  response: Response
): Response => {
  if (!negotiatesMarkdown(pathname)) {
    return response;
  }
  const varied = new Response(response.body, response);
  varied.headers.append("vary", "Accept");
  return varied;
};
