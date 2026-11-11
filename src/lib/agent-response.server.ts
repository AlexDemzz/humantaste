import { prefersMarkdown } from "./accept";
import { isInfoPageSlug } from "./info-pages";
import {
  homeMarkdown,
  infoPageMarkdown,
  llmsTxt,
  missingReportMarkdown,
  reportMarkdown,
  scanErrorMarkdown,
} from "./markdown";
import { requestScan } from "./scan-request.server";
import { HOME_MARKDOWN_PATH, absolute } from "./seo";
import { reportUrl } from "./share";
import { loadScan, recentScans } from "./store.server";
import { parseTarget } from "./target";

const READ_METHODS = new Set(["GET", "HEAD"]);
const RECENT_REPORTS = 12;
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
    status = 200,
  }: { canonical?: string; contentType: string; status?: number }
) =>
  new Response(request.method === "HEAD" ? null : body, {
    headers: {
      "content-type": contentType,
      vary: "Accept",
      ...(canonical && { link: `<${canonical}>; rel="canonical"` }),
    },
    status,
  });

const markdownResponse = (
  request: Request,
  body: string,
  options: { canonical?: string; status?: number }
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

const HTTP_UNPROCESSABLE = 422;
const HTTP_TOO_MANY_REQUESTS = 429;

/** A site nobody has scored yet is scored now, as its HTML page does. A HEAD only asks, so it starts no scan. */
const reportResponse = async (request: Request, site: string) => {
  const slug = parsedSlug(site);
  const stored = slug ? await loadScan(slug) : null;
  if (!slug || (!stored && request.method === "HEAD")) {
    return markdownResponse(request, missingReportMarkdown(slug ?? site), {
      status: 404,
    });
  }
  const outcome = stored
    ? { ok: true as const, result: stored }
    : await requestScan(slug, {
        ip: request.headers.get("cf-connecting-ip") ?? "unknown",
      });
  if (!outcome.ok) {
    return markdownResponse(request, scanErrorMarkdown(slug, outcome.error), {
      status: outcome.refused ? HTTP_TOO_MANY_REQUESTS : HTTP_UNPROCESSABLE,
    });
  }
  return markdownResponse(request, reportMarkdown(outcome.result), {
    canonical: reportUrl(slug),
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
