import { expect, it } from "vitest";

import { OG_SIZE, renderSiteCard } from "@/lib/og.server";

it("renders the site card as an OG-sized PNG", async () => {
  const view = new DataView(await renderSiteCard());
  expect({ width: view.getUint32(16), height: view.getUint32(20) }).toEqual(
    OG_SIZE
  );
});
