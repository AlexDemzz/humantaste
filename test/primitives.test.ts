import { describe, expect, it } from "vitest";

import { buttonVariants } from "@/components/ui/button";
import { itemVariants } from "@/components/ui/item";

describe("Alpaca skin (DESIGN.md › Shape and depth)", () => {
  it("fills outline buttons with the card surface, no hairline", () => {
    const outline = buttonVariants({ variant: "outline" });
    expect(outline).toContain("bg-card");
    expect(outline).toContain("shadow-xs");
    expect(outline).not.toContain("border-border");
    expect(outline).not.toContain("dark:bg-input");
  });

  it("keeps every button a pill", () => {
    expect(buttonVariants()).toContain("rounded-full");
  });

  it("turns an outline item into a filled 16px row card", () => {
    const row = itemVariants({ variant: "outline" });
    expect(row).toContain("rounded-xl");
    expect(row).toContain("bg-card");
    expect(row).toContain("px-4");
    expect(row).toContain("border-transparent");
  });
});
