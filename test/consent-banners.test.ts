import { expect, it } from "vitest";

import { isConsentManagerHost } from "@/lib/consent-banners";

it.each([
  "cdn.cookielaw.org",
  "consent.cookiebot.com",
  "web.cmp.usercentrics.eu",
])("treats %s as a consent manager's script host", (hostname) => {
  expect(isConsentManagerHost(hostname)).toBe(true);
});

it.each([
  "example.com",
  "notcdn.cookielaw.org",
  "cdn.cookielaw.org.example.net",
])("leaves %s alone", (hostname) => {
  expect(isConsentManagerHost(hostname)).toBe(false);
});

it.each(["cookiebot.com", "www.cookiebot.com", "www.onetrust.com"])(
  "still lets %s be scored, since vendors have sites of their own",
  (hostname) => {
    expect(isConsentManagerHost(hostname)).toBe(false);
  }
);
