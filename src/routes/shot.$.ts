import { createFileRoute } from "@tanstack/react-router";

import { loadScreenshot } from "@/lib/store.server";
import { parseTarget } from "@/lib/target";

export const Route = createFileRoute("/shot/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const shot = await loadScreenshot(
            parseTarget((params._splat ?? "").replace(/\.jpg$/u, "")).slug
          );
          if (shot) {
            return new Response(shot, {
              headers: {
                "content-type": "image/jpeg",
                "cache-control": "public, max-age=3600",
              },
            });
          }
        } catch {
          // An unparseable slug has no screenshot either.
        }
        return new Response("No screenshot for that page.", { status: 404 });
      },
    },
  },
});
