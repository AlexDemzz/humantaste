import { describe, expect, it } from "vitest";

import { OG_SIZE, renderShareCard } from "@/lib/og.server";
import type { ShareCard } from "@/lib/share";

const card = (overrides: Partial<ShareCard>): ShareCard => ({
  host: "linear.app",
  score: 98,
  standing: "Beats 97% of sites scored",
  jev: "it looks hand-designed",
  scanUrl: "https://humantaste.xyz/scan/linear.app",
  ...overrides,
});

const pngSize = (png: ArrayBuffer) => {
  const view = new DataView(png);
  return { width: view.getUint32(16), height: view.getUint32(20) };
};

describe("renderShareCard", () => {
  it.each([
    ["a short host", card({})],
    [
      "a long host with a three-digit score and no Jev read",
      card({
        host: "a-very-long-generated-subdomain.lovable.app",
        score: 100,
        jev: null,
      }),
    ],
    ["a mid score", card({ score: 52, standing: "Beats 48% of sites scored" })],
    ["a zero score with no rank", card({ score: 0, standing: null })],
  ])("renders %s as an OG-sized PNG", async (_, input) => {
    const png = await renderShareCard(input);
    expect(pngSize(png)).toEqual(OG_SIZE);
  });
});
