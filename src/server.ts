import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

import { agentResponse, withVaryAccept } from "./lib/agent-response.server";
import { httpsRedirect, trailingSlashRedirect } from "./lib/redirects";

export default createServerEntry({
  fetch: async (request, options) =>
    httpsRedirect(request) ??
    trailingSlashRedirect(request) ??
    (await agentResponse(request)) ??
    withVaryAccept(
      new URL(request.url).pathname,
      await handler.fetch(request, options)
    ),
});

export { SiteScan } from "./lib/site-scan.server";
