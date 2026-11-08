import { lookup as dnsLookup } from "node:dns";
import { lookup as dnsLookupAll } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const blocked = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blocked.addSubnet(net, prefix, "ipv4");
}
for (const [net, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["64:ff9b::", 96],
  ["2001:db8::", 32],
] as const) {
  blocked.addSubnet(net, prefix, "ipv6");
}

export const isPublicIp = (ip: string): boolean => {
  const family = isIP(ip);
  if (family === 0) {
    return false;
  }
  if (family === 6) {
    const mapped = ip.toLowerCase().match(/^::ffff:(?<v4>\d+\.\d+\.\d+\.\d+)$/u)
      ?.groups?.v4;
    if (mapped) {
      return isPublicIp(mapped);
    }
    const mappedHex = ip
      .toLowerCase()
      .match(/^::ffff:(?<hi>[0-9a-f]{1,4}):(?<lo>[0-9a-f]{1,4})$/u)?.groups;
    if (mappedHex?.hi && mappedHex.lo) {
      const hi = Number.parseInt(mappedHex.hi, 16);
      const lo = Number.parseInt(mappedHex.lo, 16);
      // oxlint-disable-next-line no-bitwise -- splits each 16-bit group of the mapped address into its two IPv4 octets
      return isPublicIp(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }
    return !blocked.check(ip, "ipv6");
  }
  return !blocked.check(ip, "ipv4");
};

export class BlockedUrlError extends Error {
  override name = "BlockedUrlError";
}

/** Throws unless the URL is http(s) on a default-ish port with a public hostname. */
export const assertSafeUrl = (raw: string): URL => {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BlockedUrlError("Enter a web address, like linear.app.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BlockedUrlError(
      "Enter an http or https address, like https://linear.app."
    );
  }
  if (url.username || url.password) {
    throw new BlockedUrlError("URLs with credentials can't be scored.");
  }
  const host = url.hostname.replaceAll(/^\[|\]$/gu, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new BlockedUrlError("Private hosts can't be scored.");
  }
  if (isIP(host) && !isPublicIp(host)) {
    throw new BlockedUrlError("Private addresses can't be scored.");
  }
  if (!host.includes(".") && !isIP(host)) {
    throw new BlockedUrlError("Private hosts can't be scored.");
  }
  return url;
};

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | { address: string; family: number }[],
  family?: number
) => void;

/* oxlint-disable promise/prefer-await-to-callbacks -- implements Node's callback-style dns.lookup contract for the undici connector */
/** A dns.lookup replacement that refuses to resolve to private addresses (defeats DNS rebinding at connect time). */
export const guardedLookup = (
  hostname: string,
  options: { all?: boolean } & Record<string, unknown>,
  callback: LookupCallback
): void => {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) {
      callback(err, []);
      return;
    }
    const list = addresses as { address: string; family: number }[];
    const bad = list.find((entry) => !isPublicIp(entry.address));
    const [first] = list;
    if (bad || !first) {
      callback(
        Object.assign(new Error(`Blocked private address for ${hostname}`), {
          code: "EBLOCKED",
        }),
        []
      );
      return;
    }
    if (options.all) {
      callback(null, list);
      return;
    }
    callback(null, first.address, first.family);
  });
};
/* oxlint-enable promise/prefer-await-to-callbacks */

export const resolvesPublic = async (hostname: string): Promise<boolean> => {
  const host = hostname.replaceAll(/^\[|\]$/gu, "");
  if (isIP(host)) {
    return isPublicIp(host);
  }
  let addresses: { address: string }[];
  try {
    addresses = await dnsLookupAll(host, { all: true });
  } catch {
    return false;
  }
  return (
    addresses.length > 0 &&
    addresses.every((entry) => isPublicIp(entry.address))
  );
};
