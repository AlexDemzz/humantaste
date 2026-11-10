// PROTOTYPE: the score card's small parts.
import { useMemo } from "react";
import type { CSSProperties } from "react";
import { encode } from "uqr";

import type { CardTier } from "@/lib/score";
import type { ShareCard } from "@/lib/share";

const HOST_MAX_SIZE = 64;
const HOST_FIT = 1100;

export interface CardProps {
  card: ShareCard;
  tier: CardTier;
}

export const hostStyle = (host: string) =>
  ({
    "--host-size": Math.min(HOST_MAX_SIZE, Math.round(HOST_FIT / host.length)),
  }) as CSSProperties;

export const meterStyle = (score: number) =>
  ({ "--value": score }) as CSSProperties;

/** The report's link as a QR code: a mask, so each card paints it in its own ink. */
export const Qr = ({
  url,
  className = "pc-qr",
}: {
  url: string;
  className?: string;
}) => {
  const mask = useMemo(() => {
    const { data, size } = encode(url, { ecc: "M", border: 0 });
    const cells = data.flatMap((row, y) =>
      row.flatMap((dark, x) => (dark ? [`M${x} ${y}h1v1h-1z`] : []))
    );
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><path d="${cells.join("")}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [url]);
  return (
    <span
      className={className}
      style={{ "--qr": mask } as CSSProperties}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the code is a CSS mask, so there is no image source for an <img>
      role="img"
      aria-label={`QR code to ${url}`}
    />
  );
};
