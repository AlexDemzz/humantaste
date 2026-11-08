import { expect, it } from "vitest";

import { shareOnXUrl } from "@/lib/share";

const postText = (url: string) => new URL(url).searchParams.get("text");

it("closes the post with the report's URL so X unfurls the score card", () => {
  expect(postText(shareOnXUrl("linear.app", 62))).toBe(
    "linear.app scores 62/100 on humantaste. What does your site score?\n\nhttps://humantaste.xyz/scan/linear.app"
  );
});

it("keeps a slug with URL syntax inside the text parameter", () => {
  const url = new URL(shareOnXUrl("example.com/a?b=1&c=2", 40));
  expect([...url.searchParams.keys()]).toEqual(["text"]);
  expect(url.searchParams.get("text")).toContain("example.com/a?b=1&c=2");
});
