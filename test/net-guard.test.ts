import { resolve4, resolve6 } from "node:dns/promises";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertResolvesPublic,
  assertSafeUrl,
  BlockedUrlError,
  isPublicIp,
  resolvesPublic,
} from "@/lib/net-guard";

vi.mock("node:dns/promises", () => ({
  resolve4: vi.fn(),
  resolve6: vi.fn(),
}));

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

const answers = (v4: string[] | null, v6: string[] | null) => {
  vi.mocked(resolve4).mockImplementation(() =>
    v4 ? Promise.resolve(v4) : Promise.reject(new Error("ENOTFOUND"))
  );
  vi.mocked(resolve6).mockImplementation(() =>
    v6 ? Promise.resolve(v6) : Promise.reject(new Error("ENODATA"))
  );
};

describe("host resolution", () => {
  beforeEach(() => {
    vi.mocked(resolve4).mockReset();
    vi.mocked(resolve6).mockReset();
  });

  it("treats a host with one failing address family as resolved", async () => {
    answers(["8.8.8.8"], null);
    await expect(resolvesPublic("example.com")).resolves.toBe(true);
    await expect(assertResolvesPublic("example.com")).resolves.toBeUndefined();
  });

  it("refuses a host when any address is private, and says what to do", async () => {
    answers(["8.8.8.8"], ["fd00::1"]);
    await expect(resolvesPublic("example.com")).resolves.toBe(false);
    await expect(assertResolvesPublic("example.com")).rejects.toThrow(
      /private address.*public address/u
    );
  });

  it("reports a host nothing resolves for", async () => {
    answers(null, null);
    await expect(resolvesPublic("nope.example")).resolves.toBe(false);
    await expect(assertResolvesPublic("nope.example")).rejects.toThrow(
      /doesn't resolve/u
    );
  });

  it("classifies a literal address without asking DNS", async () => {
    await expect(resolvesPublic("[::1]")).resolves.toBe(false);
    await expect(resolvesPublic("8.8.8.8")).resolves.toBe(true);
    expect(resolve4).not.toHaveBeenCalled();
  });
});
