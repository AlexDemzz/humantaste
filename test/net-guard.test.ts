import { describe, expect, it } from "vitest";

import { assertSafeUrl, BlockedUrlError, isPublicIp } from "@/lib/net-guard";

describe("SSRF guard", () => {
  it.each([
    "http://127.0.0.1/",
    "http://10.1.2.3/",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
    "http://[::ffff:192.168.0.1]/",
    "http://localhost:3000/",
    "http://printer.local/",
    "http://intranet/",
    "file:///etc/passwd",
    "ftp://example.com/",
    "https://user:pass@example.com/",
  ])("refuses %s", (url) => {
    expect(() => assertSafeUrl(url)).toThrow(BlockedUrlError);
  });

  it("accepts public http(s) URLs", () => {
    expect(assertSafeUrl("https://alexandrejoly.me/").hostname).toBe(
      "alexandrejoly.me"
    );
    expect(assertSafeUrl("http://93.184.215.14/").hostname).toBe(
      "93.184.215.14"
    );
  });

  it("classifies resolved addresses", () => {
    expect(isPublicIp("8.8.8.8")).toBe(true);
    expect(isPublicIp("2606:4700::6810:84e5")).toBe(true);
    expect(isPublicIp("100.64.0.1")).toBe(false);
    expect(isPublicIp("fd00::1")).toBe(false);
    expect(isPublicIp("::ffff:127.0.0.1")).toBe(false);
    expect(isPublicIp("::ffff:c0a8:1")).toBe(false);
    expect(isPublicIp("::ffff:808:808")).toBe(true);
  });
});
