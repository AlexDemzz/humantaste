import { SITE_HOST } from "./share";

const TRAILING_SLASHES = /\/+$/u;

/** Only the production host: local development stays on plain HTTP. */
export const httpsRedirect = (request: Request): Response | undefined => {
  const url = new URL(request.url);
  if (url.protocol !== "http:" || url.hostname !== SITE_HOST) {
    return undefined;
  }
  url.protocol = "https:";
  return Response.redirect(url.href, 301);
};

/** A permanent redirect from `/page/` to `/page`: the router's own is a 307, which search engines treat as temporary. */
export const trailingSlashRedirect = (
  request: Request
): Response | undefined => {
  const url = new URL(request.url);
  if (url.pathname === "/" || !url.pathname.endsWith("/")) {
    return undefined;
  }
  url.pathname = url.pathname.replace(TRAILING_SLASHES, "") || "/";
  return Response.redirect(url.href, 308);
};
