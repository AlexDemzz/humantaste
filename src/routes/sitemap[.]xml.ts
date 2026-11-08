import { createFileRoute } from "@tanstack/react-router";

import { INFO_PAGE_SLUGS } from "@/lib/info-pages";
import { sitemapXml } from "@/lib/seo";
import { reportsForSitemap } from "@/lib/store.server";

const MAX_SITEMAP_URLS = 50_000;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const reports = await reportsForSitemap(
          MAX_SITEMAP_URLS - 1 - INFO_PAGE_SLUGS.length
        );
        return new Response(sitemapXml(reports), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
