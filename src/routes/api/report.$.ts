import { createFileRoute } from "@tanstack/react-router";

import { requestScan } from "@/lib/scan-request.server";

export const Route = createFileRoute("/api/report/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const outcome = await requestScan(params._splat ?? "");
        if (!outcome.ok) {
          return Response.json({ error: outcome.error }, { status: 422 });
        }
        return Response.json(outcome.result, {
          headers: { "cache-control": "public, max-age=300" },
        });
      },
    },
  },
});
