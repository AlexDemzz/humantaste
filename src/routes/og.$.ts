import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

import { renderShareCardGif } from "@/lib/og-video.server";
import {
  OG_CACHE,
  OG_CONTENT_TYPE,
  OG_SIZE,
  renderShareCard,
} from "@/lib/og.server";
import { cardFromResult } from "@/lib/share";
import type { ShareCard } from "@/lib/share";
import { loadScan } from "@/lib/store.server";
import { parseTarget } from "@/lib/target";

/**
 * The card's video: an MP4 Media Transformations makes from the animated card. It is slow to make and players ask for
 * it in byte ranges, so it is kept in the edge cache, which answers those. The card is drawn from the host and the
 * score alone, so the score in the cache key is all it takes for a rescan never to be served the old video.
 */
const cardVideo = async (card: ShareCard, request: Request) => {
  const key = new URL(`?score=${card.score}`, request.url);
  const ranged = new Request(key, request);
  const cache = await caches.open("card-video");
  const cached = await cache.match(ranged);
  if (cached) {
    return cached;
  }
  const gif = await renderShareCardGif(card);
  if (!gif) {
    return new Response("That card has no video. Use its image instead.", {
      status: 404,
    });
  }
  // Without a size, the MP4 comes back scaled down.
  const mp4 = await env.MEDIA.input(new Blob([gif]).stream())
    .transform(OG_SIZE)
    .output({ mode: "video", audio: false })
    .response();
  if (!mp4.ok) {
    throw new Error(`Media Transformations answered ${mp4.status}.`);
  }
  const video = new Response(await mp4.arrayBuffer(), {
    headers: { "Content-Type": "video/mp4", "Cache-Control": OG_CACHE },
  });
  await cache.put(key, video.clone());
  // Answered from the cache even the first time: iMessage's player opens with a byte range.
  return (await cache.match(ranged)) ?? video;
};

export const Route = createFileRoute("/og/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const path = params._splat ?? "";
          const target = parseTarget(path.replace(/\.(?:png|mp4)$/u, ""));
          const stored = await loadScan(target.slug);
          if (!stored) {
            return new Response("That page has no score yet. Score it first.", {
              status: 404,
            });
          }
          const card = cardFromResult(stored);
          if (path.endsWith(".mp4")) {
            return await cardVideo(card, request);
          }
          const png = await renderShareCard(card);
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
