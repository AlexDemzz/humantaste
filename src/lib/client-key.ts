import { isIP } from "node:net";

const IPV6_FAMILY = 6;
const IPV6_GROUPS = 8;
const IPV6_NETWORK_GROUPS = 4;

/** An IPv6 customer gets a whole /64, so abuse limits count the network rather than the address. */
export const clientKey = (ip: string): string => {
  const isIpv4Mapped = ip.includes(".");
  if (isIP(ip) !== IPV6_FAMILY || isIpv4Mapped) {
    return ip;
  }
  const [head = "", tail] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const zeros = Array.from(
    {
      length: tail === undefined ? 0 : IPV6_GROUPS - left.length - right.length,
    },
    () => "0"
  );
  return [...left, ...zeros, ...right]
    .slice(0, IPV6_NETWORK_GROUPS)
    .map((group) => group.replace(/^0+(?=.)/u, ""))
    .join(":");
};
