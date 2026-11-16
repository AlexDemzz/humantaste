import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

import { OG_CACHE, OG_CONTENT_TYPE } from "@/lib/og-format";

export const Route = createFileRoute("/og.png")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await env.ENGINE.siteCard(), {
          headers: {
            "Content-Type": OG_CONTENT_TYPE,
            "Cache-Control": OG_CACHE,
          },
        }),
    },
  },
});
