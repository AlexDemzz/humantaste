import { createFileRoute } from "@tanstack/react-router";

import { OG_CACHE, OG_CONTENT_TYPE, renderShareCard } from "@/lib/og.server";
import { cardFromResult } from "@/lib/share";
import { loadScan } from "@/lib/store.server";
import { parseTarget } from "@/lib/target";

export const Route = createFileRoute("/og/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const target = parseTarget(
            (params._splat ?? "").replace(/\.png$/u, "")
          );
          const stored = await loadScan(target.slug);
          if (!stored) {
            return new Response("That page has no score yet. Score it first.", {
              status: 404,
            });
          }
          const png = await renderShareCard(cardFromResult(stored));
          return new Response(png, {
            headers: {
              "Content-Type": OG_CONTENT_TYPE,
              "Cache-Control": OG_CACHE,
            },
          });
        } catch {
          return new Response(
            "Couldn't draw a card for that page. Score the page first, then try again.",
            { status: 404 }
          );
        }
      },
    },
  },
});
