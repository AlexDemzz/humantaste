// PROTOTYPE: the validated score card, "Gloss". Not production code yet: promote it into src/components/holo-card.
// What the rounds settled, each against several alternatives:
//   layout   Today's card, plus a legend beside the number ("out of 100", "How human this website looks.").
//   effect   Gloss: the footer's line drawing is printed on the card in varnish, and the pointer is the light.
//   levels   the level is the varnish's material: none (matte), silver (chrome), pearl (holo), dispersed white
//            light (prismatic, "Prism"). A gold top level was rejected as cheap.
//   cover    the production peel, printed as "Plate": a stylised chrome sheet with the mark printed on it.
//            A photoreal brushed-metal take on it was rejected: realism is not the goal.
import { useRef, useState } from "react";
import type { CSSProperties } from "react";

import { HoloPeel } from "@/components/holo-card/holo-peel";
import { useTilt } from "@/components/holo-card/use-tilt";
import { Logo } from "@/components/logo";
import { LOGO } from "@/lib/logo";

import { hostStyle, meterStyle, Qr } from "../card";
import type { CardProps } from "../card";
import type { Skin } from "../shell";

/** The logo's mark as a mask, so the cover can print it in layers. */
const MARK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO.markViewBox}"><path fill-rule="evenodd" d="${LOGO.mark}"/></svg>`
)}")`;

const Layer = ({ className }: { className: string }) => (
  <div className={`pc-layer ${className}`} aria-hidden="true" />
);

const Print = ({ className }: { className: string }) => (
  <div className={`fx-cover ${className}`} aria-hidden="true" />
);

/** The cover's print: the mark, printed on the chrome sheet (the sheet itself is the cover's background). */
const PLATE = (
  <>
    <Print className="fx-cover-mark fx-plate-ink" />
    <Print className="fx-cover-mark fx-plate-bands" />
    <Print className="fx-cover-mark fx-plate-rules" />
  </>
);

/** The card arrives sealed under its cover, as a fresh scan does; peeling it lights the card up. */
const GlossCard = ({ card, tier }: CardProps) => {
  const ref = useRef<HTMLElement>(null);
  const [sealed, setSealed] = useState(true);
  useTilt(ref, { still: sealed });
  return (
    <div className="pc-stage">
      <article
        ref={ref}
        className="pc fx fx-gloss"
        data-tier={tier}
        data-sealed={sealed || undefined}
        style={{ "--mark": MARK } as CSSProperties}
        aria-label={`${card.host} scores ${card.score} out of 100 on humantaste`}
      >
        <div className="holo-side">
          <Layer className="fx-scene" />
          <Layer className="fx-lit" />
          <Layer className="fx-flash" />
          <Layer className="fx-frame" />
          <div className="pc-face">
            <div className="pc-head">
              <div className="td-score">
                <span className="pc-figure">
                  <span className="fx-number fx-number-rim" aria-hidden="true">
                    {card.score}
                  </span>
                  <span className="fx-number fx-number-ink">{card.score}</span>
                  <span className="fx-number fx-number-band" aria-hidden="true">
                    {card.score}
                  </span>
                </span>
                <span className="td-legend">
                  <span className="td-of">out of 100</span>
                  <span className="td-caption">
                    How human this website looks.
                  </span>
                </span>
              </div>
              <Qr url={card.scanUrl} />
            </div>
            <div className="pc-site">
              <span className="pc-host" style={hostStyle(card.host)}>
                {card.host}
              </span>
            </div>
            <div
              className="pc-ticks"
              style={meterStyle(card.score)}
              aria-hidden="true"
            />
            <div className="pc-foot">
              <Logo className="pc-brand" />
            </div>
          </div>
          <Layer className="fx-sheen" />
        </div>
        {sealed && (
          <HoloPeel onRevealed={() => setSealed(false)}>{PLATE}</HoloPeel>
        )}
      </article>
    </div>
  );
};

export const GLOSS: Skin = {
  key: "gloss",
  name: "Gloss",
  Logo,
  Card: GlossCard,
};
