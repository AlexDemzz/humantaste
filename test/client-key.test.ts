import { describe, expect, it } from "vitest";

import { clientKey } from "@/lib/client-key";

describe("clientKey", () => {
  it("counts one IPv6 network as one client, however the address is written", () => {
    const key = clientKey("2a01:e0a:12:340:aaaa:bbbb:cccc:1");
    expect(clientKey("2A01:0E0A:0012:0340:1111::2")).toBe(key);
    expect(clientKey("2a01:e0a:12:341::1")).not.toBe(key);
    expect(clientKey("2001:db8::1")).toBe(clientKey("2001:db8:0:0:ffff::9"));
  });

  it("keeps each IPv4 address as its own client", () => {
    expect(clientKey("8.8.8.8")).not.toBe(clientKey("8.8.8.9"));
  });

  it("keeps an IPv4-mapped address whole", () => {
    expect(clientKey("::ffff:8.8.8.8")).toBe("::ffff:8.8.8.8");
  });
});
