import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/og.png")({
  server: {
    handlers: {
      GET: async () => {
        // Lazy: the renderer's fonts and drawing would otherwise load on every cold start.
        const { OG_CACHE, OG_CONTENT_TYPE, renderSiteCard } =
          await import("@/lib/og.server");
        return new Response(await renderSiteCard(), {
          headers: {
            "Content-Type": OG_CONTENT_TYPE,
            "Cache-Control": OG_CACHE,
          },
        });
      },
    },
  },
});
