import { createFileRoute } from "@tanstack/react-router";

import { OG_CACHE, OG_CONTENT_TYPE, renderShareCard } from "@/lib/og.server";
import { getScan } from "@/lib/scan.server";
import { cardFromResult } from "@/lib/share";
import { parseTarget } from "@/lib/target";

export const Route = createFileRoute("/og/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const target = parseTarget(
            (params._splat ?? "").replace(/\.png$/u, "")
          );
          const png = await renderShareCard(
            cardFromResult(await getScan(target))
          );
          return new Response(png, {
            headers: {
              "Content-Type": OG_CONTENT_TYPE,
              "Cache-Control": OG_CACHE,
            },
          });
        } catch {
          return new Response("Couldn't score that page.", { status: 404 });
        }
      },
    },
  },
});
