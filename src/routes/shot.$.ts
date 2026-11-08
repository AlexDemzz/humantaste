import { createFileRoute } from "@tanstack/react-router";

import { loadScan, loadScreenshot } from "@/lib/store.server";
import { parseTarget } from "@/lib/target";

export const Route = createFileRoute("/shot/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { slug } = parseTarget(
            (params._splat ?? "").replace(/\.jpg$/u, "")
          );
          // A report from an older methodology is hidden, and its screenshot goes with it.
          const shot = (await loadScan(slug))
            ? await loadScreenshot(slug)
            : null;
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
