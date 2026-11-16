import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { DurableObject } from "cloudflare:workers";

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

/** Scans run in the engine Worker. This Worker's first migration made the class, so it is exported until a migration deletes it. */
export class SiteScan extends DurableObject {}
