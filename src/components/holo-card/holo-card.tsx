import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { encode } from "uqr";

import { Logo } from "@/components/logo";
import { tierFor } from "@/lib/score";
import { SITE_HOST } from "@/lib/share";
import type { ShareCard } from "@/lib/share";

import { HoloPeel } from "./holo-peel";
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

/** The back's print: the logo over dark foil. The peel-off cover wears it too. */
const BackArt = () => (
  <>
    <div className="holo-back-art">
      <Logo className="holo-wordmark" />
      <span className="holo-back-host">{SITE_HOST}</span>
    </div>
    <Light />
  </>
);

const JevLogo = () => (
  <svg
    className="holo-jev-logo"
    viewBox="0 0 102.6 144"
    fill="none"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M49.119.607a4.56 4.56 0 0 1 4.558.006l.005-.006L77.11 14.128a4.57 4.57 0 0 1 2.28 3.954v24.252l20.835 12.043a4.56 4.56 0 0 1 2.29 3.955v54.072a4.56 4.56 0 0 1-2.284 3.954l-.006-.006c-.044.026-.08.052-.11.066l-.027.011-46.702 26.959a4.6 4.6 0 0 1-4.031.269l-.544-.269-23.34-13.531-.038-.022a4.58 4.58 0 0 1-2.28-3.96v-24.224L2.46 89.684h-.01l-.176-.104a4.6 4.6 0 0 1-1.34-1.186l-.006-.006a4.6 4.6 0 0 1-.642-1.203l.005-.005A4.5 4.5 0 0 1 0 85.63V31.565c0-1.633.88-3.145 2.29-3.96zm-12.28 125.279 14.262 8.265 37.707-21.758-14.274-8.249zM55.972 61.27v24.4a4.56 4.56 0 0 1-2.724 4.157l-20.962 12.148v15.992l37.685-21.731V53.164zm23.143 34.977 14.267 8.238V60.968l-14.267-8.244zm-65.407-10.61 13.883 8.029 14.25-8.249-13.85-7.996zM9.143 34.195v43.539l14.295-8.227V45.085c0-1.635.865-3.142 2.285-3.96l21.11-12.169V12.464zm23.428 35.323 13.982 8.051V61.11l-13.982-8.078zm4.563-24.427 13.873 8.029 14.278-8.243-13.883-8.007zm18.837-16.13 14.29 8.222V20.718l-14.29-8.248z"
    />
  </svg>
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

/** The score and the QR code at the top; at the foot the scanned site, the verdict, the meter, Jev's read and our logo. */
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
      <span className="holo-verdict">{card.verdict}</span>
    </div>
    <div
      className="holo-ticks"
      style={{ "--value": card.score } as CSSProperties}
      aria-hidden="true"
    />
    <div className="holo-foot">
      {card.jev && (
        <p className="holo-design">
          <span className="holo-jev">
            <JevLogo />
            Jev
          </span>{" "}
          says <strong>{card.jev}</strong>
        </p>
      )}
      <Logo className="holo-brand" />
    </div>
  </div>
);

/**
 * The scan as a holo card. Without a `card` it shows its back, which sways while the scan runs; nothing printed on it
 * changes. When a `card` arrives it turns once, top over bottom, to the front. Mounted with a `card`, it starts on the front.
 * With `sealed` (a fresh scan), the card arrives under a cover printed like its back, which the reader peels off.
 */
export const HoloCard = ({
  slug,
  card,
  sealed: startSealed = false,
}: {
  slug: string;
  card: ShareCard | null;
  sealed?: boolean;
}) => {
  const ref = useRef<HTMLElement>(null);
  const [sealed, setSealed] = useState(startSealed);
  const done = card !== null;
  const covered = done && sealed;
  useTilt(ref, { idle: !done, still: covered });

  return (
    <div className="holo-stage">
      <article
        ref={ref}
        className="holo"
        data-state={done ? "done" : "loading"}
        data-sealed={covered || undefined}
        data-tier={card ? tierFor(card.score) : undefined}
        aria-busy={!done}
        aria-label={
          card
            ? `${card.host} scores ${card.score} out of 100`
            : `Scoring ${slug}`
        }
      >
        <div className="holo-flipper">
          <div className="holo-side holo-back" aria-hidden={done}>
            <BackArt />
          </div>
          <div className="holo-side holo-front" aria-hidden={!done}>
            <div className="holo-etch" aria-hidden="true" />
            {card && <Front card={card} />}
            <Light />
          </div>
        </div>
        {covered && (
          <HoloPeel onRevealed={() => setSealed(false)}>
            <BackArt />
          </HoloPeel>
        )}
      </article>
    </div>
  );
};
