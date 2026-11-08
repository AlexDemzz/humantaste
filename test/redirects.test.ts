import { expect, it } from "vitest";

import { httpsRedirect, trailingSlashRedirect } from "@/lib/redirects";

const redirect = (response: Response | undefined) => [
  response?.status,
  response?.headers.get("location"),
];

it("moves plain HTTP to HTTPS for good, on the production host", () => {
  const response = httpsRedirect(new Request("http://humantaste.xyz/scan/a.b"));
  expect(redirect(response)).toEqual([301, "https://humantaste.xyz/scan/a.b"]);
});

it("leaves local development on HTTP", () => {
  expect(httpsRedirect(new Request("http://localhost:3217/"))).toBeUndefined();
});

it("drops a trailing slash permanently and keeps the query", () => {
  const response = trailingSlashRedirect(
    new Request("https://humantaste.xyz/scan/a.b/?x=1")
  );
  expect(redirect(response)).toEqual([
    308,
    "https://humantaste.xyz/scan/a.b?x=1",
  ]);
});

it("leaves the home page alone", () => {
  expect(
    trailingSlashRedirect(new Request("https://humantaste.xyz/"))
  ).toBeUndefined();
});
