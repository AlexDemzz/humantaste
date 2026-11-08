import { describe, expect, it } from "vitest";

import { InvalidTargetError, parseTarget } from "@/lib/target";

describe("scan targets", () => {
  it.each([
    ["alexandrejoly.me", "alexandrejoly.me"],
    ["https://www.Vercel.com/", "vercel.com"],
    ["http://example.com/pricing/", "example.com/pricing"],
    ["example.com/docs?tab=api", "example.com/docs?tab=api"],
    ["https%3A%2F%2Flinear.app", "linear.app"],
  ])("turns %s into /scan/%s", (raw, slug) => {
    expect(parseTarget(raw).slug).toBe(slug);
  });

  it.each(["", "localhost", "ftp://example.com", "not a url at all"])(
    "refuses %j",
    (raw) => {
      expect(() => parseTarget(raw)).toThrow(InvalidTargetError);
    }
  );
});
