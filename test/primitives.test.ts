import { describe, expect, it } from "vitest";

import { buttonVariants } from "@/components/ui/button";
import { itemVariants } from "@/components/ui/item";

describe("Alpaca skin (DESIGN.md › Shape and depth)", () => {
  it("fills secondary buttons flat, no hairline and no shadow", () => {
    const secondary = buttonVariants({ variant: "secondary" });
    expect(secondary).toContain("bg-secondary");
    expect(secondary).not.toContain("shadow-xs");
    expect(secondary).not.toContain("border-border");
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
