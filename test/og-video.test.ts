import { expect, it } from "vitest";

import { renderShareCardGif } from "@/lib/og-video.server";
import { OG_SIZE } from "@/lib/og.server";
import type { ShareCard } from "@/lib/share";

const card = (score: number): ShareCard => ({
  host: "linear.app",
  score,
  scanUrl: "https://humantaste.xyz/scan/linear.app",
});

const gifSize = (gif: Uint8Array) => {
  const view = new DataView(gif.buffer, gif.byteOffset);
  return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
};

it("animates the sheen of a card that has one as an OG-sized GIF", async () => {
  const gif = await renderShareCardGif(card(98));
  expect(gif && gifSize(gif)).toEqual(OG_SIZE);
});

it("has no animation for a matte card: nothing on it moves", async () => {
  expect(await renderShareCardGif(card(30))).toBeNull();
});
