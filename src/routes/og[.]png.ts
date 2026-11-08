import { createFileRoute } from "@tanstack/react-router";

import { OG_CACHE, OG_CONTENT_TYPE, renderSiteCard } from "@/lib/og.server";

export const Route = createFileRoute("/og.png")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await renderSiteCard(), {
          headers: {
            "Content-Type": OG_CONTENT_TYPE,
            "Cache-Control": OG_CACHE,
          },
        }),
    },
  },
});
