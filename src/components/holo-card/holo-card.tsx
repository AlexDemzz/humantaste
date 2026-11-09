import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { encode } from "uqr";

import { Logo, LogoMark } from "@/components/logo";
import { tierFor } from "@/lib/score";
import type { ShareCard } from "@/lib/share";

import { HoloPeel } from "./holo-peel";
import { MotionDialog } from "./motion-dialog";
import { PrismFoil } from "./prism-foil";
import { useTilt } from "./use-tilt";

const HOST_MAX_SIZE = 64;
const HOST_FIT = 1100;

/** The light layers each side stacks over its face. */
const Light = () => (
  <>
    <div className="holo-foil" aria-hidden="true" />
    <div className="holo-glare" aria-hidden="true" />
    <div className="holo-sweep" aria-hidden="true" />
  </>
);

/** The back's print: the logo's mark over dark foil. The peel-off cover wears it too. */
const BackArt = () => (
  <>
    <div className="holo-back-art">
      <LogoMark className="holo-mark" />
    </div>
    <Light />
  </>
);

/**
 * The scan's link as a QR code. The modules are a mask over the same foil ink as the score, so the code shifts colour
 * with the tilt; light modules on the dark card make it an inverted code, which phone cameras read.
 */
const QrCode = ({ url }: { url: string }) => {
  const mask = useMemo(() => {
    const { data, size } = encode(url, { ecc: "M", border: 0 });
    // Full-size square modules: any gap between them breaks the run lengths scanners read.
    const cells = data.flatMap((row, y) =>
      row.flatMap((dark, x) => (dark ? [`M${x} ${y}h1v1h-1z`] : []))
    );
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><path d="${cells.join("")}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [url]);
  return (
    <span
      className="holo-qr"
      style={{ "--qr": mask } as CSSProperties}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the code is a CSS mask over the foil ink, so there is no image source for an <img>
      role="img"
      aria-label={`QR code to ${url}`}
    />
  );
};

/** The score and the QR code at the top; at the foot the scanned site, the meter and our logo. */
const Front = ({ card }: { card: ShareCard }) => (
  <div className="holo-face">
    <div className="holo-head">
      <span className="holo-figure">
        <span className="holo-number-chrome" aria-hidden="true">
          {card.score}
        </span>
        <span className="holo-number">{card.score}</span>
      </span>
      <QrCode url={card.scanUrl} />
    </div>
    <div className="holo-score-side">
      <span
        className="holo-host"
        style={
          {
            "--host-size": Math.min(
              HOST_MAX_SIZE,
              Math.round(HOST_FIT / card.host.length)
            ),
          } as CSSProperties
        }
      >
        {card.host}
      </span>
    </div>
    <div
      className="holo-ticks"
      style={{ "--value": card.score } as CSSProperties}
      aria-hidden="true"
    />
    <div className="holo-foot">
      <Logo className="holo-brand" />
    </div>
  </div>
);

/**
 * The scan as a holo card, front up. With `sealed` (a fresh scan), it arrives under a cover printed like the back,
 * which the reader peels off.
 */
export const HoloCard = ({
  card,
  sealed: startSealed = false,
}: {
  card: ShareCard;
  sealed?: boolean;
}) => {
  const ref = useRef<HTMLElement>(null);
  const tier = tierFor(card.score);
  const [sealed, setSealed] = useState(startSealed);
  const { askingMotion, allowMotion, skipMotion } = useTilt(ref, {
    still: sealed,
  });

  return (
    <div className="holo-stage">
      <MotionDialog
        open={askingMotion}
        onAllow={allowMotion}
        onSkip={skipMotion}
      />
      <article
        ref={ref}
        className="holo"
        data-sealed={sealed || undefined}
        data-tier={tier}
        aria-label={`${card.host} scores ${card.score} out of 100`}
      >
        <div className="holo-side holo-front">
          <div className="holo-etch" aria-hidden="true">
            {tier === "prismatic" && <PrismFoil />}
          </div>
          <Front card={card} />
          <Light />
        </div>
        {sealed && (
          <HoloPeel onRevealed={() => setSealed(false)}>
            <BackArt />
          </HoloPeel>
        )}
      </article>
    </div>
  );
};
