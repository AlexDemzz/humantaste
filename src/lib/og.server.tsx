import { encode } from "uqr";

import kanitBlackItalic from "../../assets/fonts/display/Kanit-BlackItalic.ttf?arraybuffer";
import interMedium from "../../assets/fonts/og/Inter-Medium.ttf?arraybuffer";
import interSemiBold from "../../assets/fonts/og/Inter-SemiBold.ttf?arraybuffer";
import cardScene from "../../assets/images/og-card-scene.png?arraybuffer";
import { LOGO, LOGO_HEIGHT_EM } from "./logo";
import { tierFor } from "./score";
import type { CardTier } from "./score";
import { SITE_CARD } from "./seo";
import type { ShareCard } from "./share";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
/** A scan is kept until it is rescanned, so its card can sit at the edge for a day. */
export const OG_CACHE = "public, max-age=3600, s-maxage=86400";

/** The light card's tokens from holo-card.css, in hex: the renderer has no oklch(). The share image draws the light
 * card ("Pearl") at rest, whatever the page's theme. */
const C = {
  stock: "#ffffff",
  ink: "#242424",
  quiet: "#565656",
  tickOff: "#d7d7d7",
};

const toBase64 = (bytes: ArrayBuffer) => {
  const view = new Uint8Array(bytes);
  const CHUNK = 0x80_00;
  let binary = "";
  for (let start = 0; start < view.length; start += CHUNK) {
    binary += String.fromCodePoint(...view.subarray(start, start + CHUNK));
  }
  return btoa(binary);
};

/** The footer's drawing as the card prints it: white on transparent, so it masks whatever ink is laid through it. */
const SCENE = `data:image/png;base64,${toBase64(cardScene)}`;

/** A gradient as the card shows it at rest: the slice of its stops its oversized background leaves in view. */
interface Ink {
  stops: readonly string[];
  angle: number;
}

interface TierLook {
  /** The number. */
  coat: Ink;
  meter: readonly string[];
  /** The sheen over the card, already laid on the white. */
  surface: Ink | null;
  /** How dark the drawing prints. */
  scene: number;
  /** The varnish the light lays on the drawing at rest, around the card's centre. */
  film: {
    stops: readonly (readonly [string, number])[];
    opacity: number;
  } | null;
  /** The top level's frame. */
  spectrum: Ink | null;
}

const FLAT = [C.ink, C.ink];
const SPECTRUM: Ink = {
  stops: [
    "#3dac4c",
    "#2aa86b",
    "#0ba483",
    "#009e99",
    "#0099ae",
    "#138db9",
    "#3680c3",
    "#4872ce",
    "#5663d7",
  ],
  angle: 90,
};

/** The film shows at the light's resting strength (--rest), halved as on the card. */
const LOOKS: Record<CardTier, TierLook> = {
  matte: {
    coat: { stops: FLAT, angle: 115 },
    meter: FLAT,
    surface: null,
    scene: 0.2,
    film: null,
    spectrum: null,
  },
  chrome: {
    coat: {
      stops: [
        "#51575d",
        "#444a50",
        "#373d43",
        "#2b3137",
        "#494e53",
        "#74787c",
        "#898c90",
        "#7a7e82",
        "#6b6f74",
        "#5c6166",
        "#52585e",
      ],
      angle: 160,
    },
    meter: ["#696d72", "#73777b", "#7d8185", "#73777b", "#696d72"],
    surface: {
      stops: [
        "#eeeff1",
        "#e9ebed",
        "#eff0f2",
        "#f4f5f6",
        "#fafbfb",
        "#f3f5f6",
        "#edeff0",
        "#e6e9eb",
        "#ebedef",
      ],
      angle: 160,
    },
    scene: 0.08,
    film: {
      stops: [
        ["#282f36", 0],
        ["#595e64", 0.5],
        ["#82878c", 1],
      ],
      opacity: 0.225,
    },
    spectrum: null,
  },
  holo: {
    coat: {
      stops: [
        "#5e768e",
        "#6d8598",
        "#7c94a1",
        "#8095a1",
        "#738294",
        "#666f87",
        "#595d7a",
        "#525273",
        "#606584",
        "#6e7895",
        "#7d8ca6",
      ],
      angle: 115,
    },
    meter: ["#707492", "#797797", "#827b9c", "#797797", "#707492"],
    surface: {
      stops: [
        "#f8f6ff",
        "#f7f6fe",
        "#f7f8fe",
        "#f7fafe",
        "#f8fcfe",
        "#fafdfe",
        "#fdfeff",
        "#fefeff",
        "#fafcff",
      ],
      angle: 115,
    },
    scene: 0.08,
    film: {
      stops: [
        ["#425677", 0],
        ["#857a9a", 0.5],
        ["#5a7685", 1],
      ],
      opacity: 0.275,
    },
    spectrum: null,
  },
  prismatic: {
    coat: {
      stops: ["#23252e", "#202229", "#1e1f24", "#232128", "#28242b"],
      angle: 115,
    },
    meter: SPECTRUM.stops,
    surface: {
      stops: [
        "#fff1d8",
        "#faf7dc",
        "#eef9de",
        "#e0f9e0",
        "#d9f8e9",
        "#d5f7f5",
        "#d6f2fd",
        "#daecff",
        "#e3e7ff",
        "#f0e3ff",
        "#fbe1f8",
        "#ffe0eb",
        "#ffdfde",
        "#ffe5d9",
        "#ffebd5",
        "#fff1d8",
        "#faf7dc",
        "#eef9de",
        "#e0f9e0",
        "#d9f8e9",
        "#d5f7f5",
        "#d6f2fd",
        "#daecff",
        "#e3e7ff",
        "#f0e3ff",
      ],
      angle: 115,
    },
    scene: 0.08,
    film: {
      stops: [
        ["#242424", 0],
        ["#242424", 0.4],
        ["#e54151", 0.52],
        ["#ee921a", 0.61],
        ["#3fac4a", 0.7],
        ["#0099ae", 0.79],
        ["#5761d8", 0.89],
        ["#b740b1", 1],
      ],
      opacity: 0.35,
    },
    spectrum: SPECTRUM,
  },
};

const FACE_INLINE = 72;
const METER_WIDTH = OG_SIZE.width - 2 * FACE_INLINE;
const TICKS = 100;
const TICK_WIDTH = 7;
const QR_TARGET = 150;
const NUMBER_SIZE = 250;
const NUMBER_TRACKING = -0.05;
/** Room after the last figure, so the italic's lean keeps its ink. */
const NUMBER_TAIL = 0.1;
const HEAD_GAP = 24;
const SCORE_GAP = 40;
/** The same space above and below the meter. */
const METER_GAP = 32;
/** The logo set at the foot like 30px type, as on the card. */
const BRAND_SIZE = 30;
const FRAME_INSET = 16;
const FRAME_WIDTH = 2;
const FRAME_RADIUS = 22;
/** The frame at rest: 0.55, plus the light's resting strength. */
const FRAME_OPACITY = 0.865;
/** The radius of the pool of light, centred on a card at rest. */
const LIGHT = 640;

const { width: W, height: H } = OG_SIZE;

/** Where a CSS gradient at `angle` starts and ends on a box, as SVG gradient coordinates. */
const gradientLine = (
  angle: number,
  box: { x: number; y: number; width: number; height: number }
) => {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const half = (Math.abs(box.width * dx) + Math.abs(box.height * dy)) / 2;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  return {
    x1: cx - dx * half,
    y1: cy - dy * half,
    x2: cx + dx * half,
    y2: cy + dy * half,
  };
};

const evenStops = (stops: readonly string[]) =>
  stops.map((stop, i) => (
    <stop key={i} offset={i / (stops.length - 1)} stopColor={stop} />
  ));

const FRAME_BOX = {
  x: FRAME_INSET + FRAME_WIDTH / 2,
  y: FRAME_INSET + FRAME_WIDTH / 2,
  width: W - 2 * FRAME_INSET - FRAME_WIDTH,
  height: H - 2 * FRAME_INSET - FRAME_WIDTH,
};

/**
 * Everything under the type, as on the card at rest: the sheen, the drawing, its varnish around the centre, and the
 * top level's frame. Satori only serializes plain SVG elements inside an svg, and only preloads an <image> it can see
 * in the element tree before rendering, so this is a function the card calls, not a component.
 */
const stock = (look: TierLook) => (
  <svg
    width={W}
    height={H}
    viewBox={`0 0 ${W} ${H}`}
    style={{ position: "absolute", top: 0, left: 0 }}
  >
    <defs>
      <mask id="scene">
        <image href={SCENE} width={W} height={H} />
      </mask>
      {look.surface && (
        <linearGradient
          id="surface"
          gradientUnits="userSpaceOnUse"
          {...gradientLine(look.surface.angle, {
            x: 0,
            y: 0,
            width: W,
            height: H,
          })}
        >
          {evenStops(look.surface.stops)}
        </linearGradient>
      )}
      {look.film && (
        <radialGradient
          id="film"
          gradientUnits="userSpaceOnUse"
          cx={W / 2}
          cy={H / 2}
          r={LIGHT}
        >
          {look.film.stops.map(([color, offset]) => (
            <stop key={offset} offset={offset} stopColor={color} />
          ))}
        </radialGradient>
      )}
      {look.film && (
        <mask id="pool">
          <radialGradient
            id="pool-light"
            gradientUnits="userSpaceOnUse"
            cx={W / 2}
            cy={H / 2}
            r={LIGHT}
          >
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <rect width={W} height={H} fill="url(#pool-light)" />
        </mask>
      )}
      {look.spectrum && (
        <linearGradient
          id="frame"
          gradientUnits="userSpaceOnUse"
          {...gradientLine(look.spectrum.angle, FRAME_BOX)}
        >
          {evenStops(look.spectrum.stops)}
        </linearGradient>
      )}
    </defs>
    {look.surface && <rect width={W} height={H} fill="url(#surface)" />}
    <rect
      width={W}
      height={H}
      fill={C.ink}
      fillOpacity={look.scene}
      mask="url(#scene)"
    />
    {look.film && (
      <g mask="url(#scene)">
        <rect
          width={W}
          height={H}
          fill="url(#film)"
          opacity={look.film.opacity}
          mask="url(#pool)"
        />
      </g>
    )}
    {look.spectrum && (
      <rect
        {...FRAME_BOX}
        rx={FRAME_RADIUS - FRAME_WIDTH / 2}
        fill="none"
        stroke="url(#frame)"
        strokeWidth={FRAME_WIDTH}
        strokeOpacity={FRAME_OPACITY}
      />
    )}
  </svg>
);

const hexToRgb = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  // oxlint-disable-next-line no-bitwise -- unpacks the red, green and blue bytes of a packed #rrggbb value
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** The ink's colour a fraction `t` of the way along its stops. */
const inkAt = (stops: readonly string[], t: number): string => {
  const span = (stops.length - 1) * Math.min(1, Math.max(0, t));
  const index = Math.min(stops.length - 2, Math.floor(span));
  const from = hexToRgb(stops[index] ?? "#ffffff");
  const to = hexToRgb(stops[index + 1] ?? "#ffffff");
  const mix = from.map((channel, i) =>
    Math.round(channel + ((to[i] ?? channel) - channel) * (span - index))
  );
  return `rgb(${mix.join(" ")})`;
};

/** The host is the card's second voice: 64px at most, smaller when it is long. */
const hostSize = (host: string) => Math.min(64, Math.round(1100 / host.length));

/** Gradient text: the renderer paints the background through the glyphs. */
const inkText = ({ angle, stops }: Ink) =>
  ({
    backgroundImage: `linear-gradient(${angle}deg, ${stops.join(", ")})`,
    backgroundClip: "text",
    color: "transparent",
  }) as const;

/** The QR code in the card's one flat ink, so it scans. */
const QrCode = ({ url }: { url: string }) => {
  const { data, size } = encode(url, { ecc: "M", border: 0 });
  // Whole-pixel modules with no gap between them: scanners read the run lengths.
  const module = Math.max(1, Math.round(QR_TARGET / size));
  const cells = data.flatMap((row, y) =>
    row.flatMap((dark, x) => (dark ? [`M${x} ${y}h1v1h-1z`] : []))
  );
  return (
    <svg
      width={size * module}
      height={size * module}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
    >
      <path d={cells.join("")} fill={C.ink} />
    </svg>
  );
};

const Meter = ({
  value,
  stops,
}: {
  value: number;
  stops: readonly string[];
}) => {
  const lit = Math.max(1, Math.round(value));
  const pitch = METER_WIDTH / TICKS;
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: METER_WIDTH,
        height: 22,
      }}
    >
      {Array.from({ length: TICKS }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: Math.round(i * pitch),
            width: TICK_WIDTH,
            height: 22,
            background:
              i < lit ? inkAt(stops, i / Math.max(1, lit - 1)) : C.tickOff,
          }}
        />
      ))}
    </div>
  );
};

/** Our logo, sized like the card's foot. */
const Brand = () => (
  <svg
    width={(LOGO.width / LOGO.em) * BRAND_SIZE}
    height={LOGO_HEIGHT_EM * BRAND_SIZE}
    viewBox={LOGO.viewBox}
  >
    <path fill={C.ink} fillRule="evenodd" d={LOGO.mark} />
    <path
      fill={C.ink}
      stroke={C.ink}
      strokeWidth={LOGO.stroke}
      strokeLinejoin="round"
      d={LOGO.word}
    />
  </svg>
);

/**
 * The score in the level's material, then what it is a score of. The card's spectrum rim on the top level's number is
 * left out: the renderer draws no text stroke, and an outline faked from offset copies would blur.
 */
const Score = ({ score, look }: { score: number; look: TierLook }) => {
  const figures = {
    fontFamily: "Kanit",
    fontStyle: "italic",
    fontWeight: 900,
    fontSize: NUMBER_SIZE,
    lineHeight: 0.72,
    letterSpacing: NUMBER_TRACKING * NUMBER_SIZE,
    paddingRight: NUMBER_TAIL * NUMBER_SIZE,
  } as const;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: SCORE_GAP }}>
      <span style={{ ...figures, ...inkText(look.coat) }}>{score}</span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          paddingTop: 8,
          maxWidth: 340,
        }}
      >
        <span
          style={{
            fontSize: 44,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: -0.02 * 44,
            color: C.ink,
          }}
        >
          out of 100
        </span>
        <span
          style={{
            fontSize: 26,
            lineHeight: 1.25,
            color: C.quiet,
            textWrap: "balance",
          }}
        >
          How human this website looks.
        </span>
      </div>
    </div>
  );
};

/** The score card's front, frozen at rest: the same marks in the same order of weight as the card on the scan page. */
export const ShareCardImage = ({ card }: { card: ShareCard }) => {
  const host = hostSize(card.host);
  const look = LOOKS[tierFor(card.score)];
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        background: C.stock,
        color: C.ink,
        fontFamily: "Inter",
        fontWeight: 500,
      }}
    >
      {stock(look)}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          flexGrow: 1,
          padding: `60px ${FACE_INLINE}px`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: HEAD_GAP,
          }}
        >
          <Score score={card.score} look={look} />
          <QrCode url={card.scanUrl} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: METER_WIDTH,
            marginTop: "auto",
            marginBottom: METER_GAP,
          }}
        >
          <span
            style={{
              fontSize: host,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -0.02 * host,
              wordBreak: "break-all",
              color: C.ink,
            }}
          >
            {card.host}
          </span>
        </div>

        <Meter value={card.score} stops={look.meter} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: METER_GAP,
          }}
        >
          <Brand />
        </div>
      </div>
    </div>
  );
};

const PAPER = { background: "#ffffff", ink: "#242424", prose: "#565656" };
const STATEMENT_SIZE = 58;
const SITE_LOGO_SIZE = 44;

/** The card for every page without a score of its own: the site's statement, signed with the logo. */
const SiteCardImage = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      width: "100%",
      height: "100%",
      padding: 80,
      background: PAPER.background,
      fontFamily: "Inter",
      fontSize: STATEMENT_SIZE,
      fontWeight: 600,
      lineHeight: 1.16,
      letterSpacing: -0.02 * STATEMENT_SIZE,
    }}
  >
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ color: PAPER.ink }}>{SITE_CARD.question}</span>
      <span style={{ color: PAPER.prose }}>{SITE_CARD.answer}</span>
    </div>
    <svg
      width={(LOGO.width / LOGO.em) * SITE_LOGO_SIZE}
      height={LOGO_HEIGHT_EM * SITE_LOGO_SIZE}
      viewBox={LOGO.viewBox}
    >
      <path fill={PAPER.ink} fillRule="evenodd" d={LOGO.mark} />
      <path
        fill={PAPER.ink}
        stroke={PAPER.ink}
        strokeWidth={LOGO.stroke}
        strokeLinejoin="round"
        d={LOGO.word}
      />
    </svg>
  </div>
);

export const renderSiteCard = async (): Promise<ArrayBuffer> => {
  const { ImageResponse } = await import("@cf-wasm/og");
  const image = new ImageResponse(<SiteCardImage />, {
    ...OG_SIZE,
    fonts: [
      { name: "Inter", data: interMedium, weight: 500 },
      { name: "Inter", data: interSemiBold, weight: 600 },
    ],
  });
  return image.arrayBuffer();
};

/** Renders the card to PNG bytes with the same renderer as our other OG images: Satori and resvg compiled to WASM. */
export const renderShareCard = async (
  card: ShareCard
): Promise<ArrayBuffer> => {
  const { ImageResponse } = await import("@cf-wasm/og");
  // Called, not mounted: Satori looks for the drawing's <image> in the tree it is handed.
  const image = new ImageResponse(ShareCardImage({ card }), {
    ...OG_SIZE,
    fonts: [
      { name: "Kanit", data: kanitBlackItalic, weight: 900, style: "italic" },
      { name: "Inter", data: interMedium, weight: 500 },
      { name: "Inter", data: interSemiBold, weight: 600 },
    ],
  });
  return image.arrayBuffer();
};
