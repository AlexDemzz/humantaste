// oxlint-disable eslint/class-methods-use-this -- a binding only reaches the methods of an entrypoint's instance
import { WorkerEntrypoint } from "cloudflare:workers";

import type { ShareCard } from "./lib/share";

export { SiteScan } from "./lib/site-scan.server";

/**
 * The heavy work, kept out of the Worker that serves pages so its cold start stays short: the scans (a browser) and
 * the share images (their fonts and renderer). The site reaches it through its bindings, never over the network.
 */
export default class Engine extends WorkerEntrypoint<EngineEnv> {
  async siteCard(): Promise<ArrayBuffer> {
    const { renderSiteCard } = await import("./lib/og.server");
    return renderSiteCard();
  }

  async shareCard(card: ShareCard): Promise<ArrayBuffer> {
    const { renderShareCard } = await import("./lib/og.server");
    return renderShareCard(card);
  }

  /** Null for a matte card, which has no sheen to animate. */
  async shareCardGif(card: ShareCard): Promise<Uint8Array<ArrayBuffer> | null> {
    const { renderShareCardGif } = await import("./lib/og-video.server");
    return renderShareCardGif(card);
  }
}
