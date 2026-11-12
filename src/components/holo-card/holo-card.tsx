import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { encode } from "uqr";

import { Logo } from "@/components/logo";
import { LOGO } from "@/lib/logo";
import { tierFor } from "@/lib/score";
import type { ShareCard } from "@/lib/share";

import { HoloPeel } from "./holo-peel";
import { MotionDialog } from "./motion-dialog";
import { useTilt } from "./use-tilt";

const HOST_MAX_SIZE = 64;
const HOST_FIT = 1100;

/** The logo's mark as a mask, so the cover can print it in layers. */
const MARK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO.markViewBox}"><path fill-rule="evenodd" d="${LOGO.mark}"/></svg>`
)}")`;

const Layer = ({ className }: { className: string }) => (
  <div className={className} aria-hidden="true" />
);

/** The cover's print: the mark, printed on the chrome sheet (the sheet itself is the cover's background). */
const Plate = () => (
  <>
    <Layer className="holo-plate holo-plate-ink" />
    <Layer className="holo-plate holo-plate-bands" />
    <Layer className="holo-plate holo-plate-rules" />
  </>
);

/** The scan's link as a QR code: a mask, so it takes the card's ink and stays a plain dark-on-light or light-on-dark code. */
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
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the code is a CSS mask, so there is no image source for an <img>
      role="img"
      aria-label={`QR code to ${url}`}
    />
  );
};

/** The score and what it is a score of, with the QR code at the top; at the foot the scanned site, the meter and our logo. */
const Front = ({ card }: { card: ShareCard }) => (
  <div className="holo-face">
    <div className="holo-head">
      <div className="holo-score">
        <span className="holo-figure">
          <span className="holo-number holo-number-rim" aria-hidden="true">
            {card.score}
          </span>
          <span className="holo-number holo-number-ink">{card.score}</span>
          <span className="holo-number holo-number-band" aria-hidden="true">
            {card.score}
          </span>
        </span>
        <span className="holo-legend">
          <span className="holo-of">out of 100</span>
          <span className="holo-caption">How human this website looks.</span>
        </span>
      </div>
      <QrCode url={card.scanUrl} />
    </div>
    <div className="holo-site">
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
 * The scan as a score card. The footer's drawing is printed on it in varnish, lit by the pointer, and the score's level
 * is the varnish's material. With `sealed` (a fresh scan), it arrives under a chrome cover the reader peels off.
 * Each new `seal` value puts the cover back on, without remounting the card.
 */
export const HoloCard = ({
  card,
  sealed: startSealed = false,
  seal = 0,
}: {
  card: ShareCard;
  sealed?: boolean;
  seal?: number;
}) => {
  const ref = useRef<HTMLElement>(null);
  const [sealed, setSealed] = useState(startSealed);
  const [lastSeal, setLastSeal] = useState(seal);
  if (seal !== lastSeal) {
    setLastSeal(seal);
    setSealed(true);
  }
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
        data-tier={tierFor(card.score)}
        style={{ "--mark": MARK } as CSSProperties}
        aria-label={`${card.host} scores ${card.score} out of 100`}
      >
        <div className="holo-side">
          <Layer className="holo-scene" />
          <Layer className="holo-lit" />
          <Layer className="holo-flash" />
          <Layer className="holo-frame" />
          <Front card={card} />
          <Layer className="holo-sheen" />
        </div>
        {sealed && (
          <HoloPeel onRevealed={() => setSealed(false)}>
            <Plate />
          </HoloPeel>
        )}
      </article>
    </div>
  );
};
