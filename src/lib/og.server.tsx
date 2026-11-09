import type { ReactElement } from "react";
import { encode } from "uqr";

import kanitBlackItalic from "../../assets/fonts/display/Kanit-BlackItalic.ttf?arraybuffer";
import interMedium from "../../assets/fonts/og/Inter-Medium.ttf?arraybuffer";
import interSemiBold from "../../assets/fonts/og/Inter-SemiBold.ttf?arraybuffer";
import { LOGO, LOGO_HEIGHT_EM } from "./logo";
import { tierFor } from "./score";
import type { CardTier } from "./score";
import { SITE_CARD } from "./seo";
import type { ShareCard } from "./share";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
/** A scan is kept until it is rescanned, so its card can sit at the edge for a day. */
export const OG_CACHE = "public, max-age=3600, s-maxage=86400";

/** The card's dark tokens from holo-card.css and styles.css, in hex: the renderer has no oklch(). */
const C = {
  card: "#191715",
  fg: "#f0eeec",
  tickOff: "#343230",
};

/** The card's inks at rest, evenly spaced: the middle third of each gradient, as its 300% background shows it. */
const FOIL = [
  "#cde393",
  "#e9d985",
  "#ffcf77",
  "#fcc2a6",
  "#f7b5cb",
  "#f4a5ec",
  "#daadf7",
  "#bfb4ff",
  "#a0baff",
  "#94c8ff",
  "#86d5f4",
];
const SILVER = [
  "#8c9197",
  "#797e84",
  "#666c71",
  "#54595f",
  "#83888c",
  "#c8cbcd",
  "#eaebed",
  "#d1d3d6",
  "#b8bcc0",
  "#a0a5a9",
  "#91969b",
];
const BRIGHT_SILVER = ["#d3d6d9", "#f4f5f6", "#d3d6d9"];
/** The frame's slice of the same gradients: its background is 400%, so the middle quarter shows. */
const FOIL_FRAME = ["#efd782", "#fbc1ab", "#f4a5ec", "#c2b3ff", "#97c4ff"];
const SILVER_FRAME = ["#747a7f", "#52575d", "#c8cbcd", "#d4d6d9", "#a6aaaf"];
const GOLD_FRAME = ["#dca236", "#b77d2b", "#925a25", "#be8b41", "#eabf5d"];
const FOIL_ANGLE = 115;
const METAL_ANGLE = 160;

const FACE_INLINE = 72;
const METER_WIDTH = OG_SIZE.width - 2 * FACE_INLINE;
const TICKS = 100;
const TICK_WIDTH = 7;
const QR_TARGET = 150;
const NUMBER_SIZE = 250;
const NUMBER_TRACKING = -0.05;
/** Room after the last figure, so the italic's lean keeps its ink. */
const NUMBER_TAIL = 0.1;
/** The card-coloured cut, then the chrome copy, pushed down and right behind the number. */
const CUT_OFFSET = 7;
const CHROME_OFFSET = 13;
const HEAD_GAP = 24;
/** The same space above and below the meter. */
const METER_GAP = 32;
/** The logo set at the foot like 30px type, as on the card. */
const BRAND_SIZE = 30;
const FRAME_INSET = 16;
const FRAME_RADIUS = 22;

/** The chrome copy's gradient at rest, where the card shows its dark band just above the middle. */
const CHROME =
  "linear-gradient(180deg, #b5b9be 0%, #4b4f55 42%, #eceef0 58%, #a9adb2 100%)";

interface TierLook {
  card: string;
  /** Every foil-inked mark: the number, the QR code and the meter, and the host unless `hostInk` is set. */
  ink: readonly string[];
  /** For a tier whose ink has bands too dark to read a site's name in. */
  hostInk?: readonly string[];
  angle: number;
  /** The copy behind the number. */
  shadow: string;
  frame: {
    stops: readonly string[];
    angle: number;
    width: number;
    opacity: number;
  } | null;
}

const LOOKS: Record<CardTier, TierLook> = {
  matte: {
    card: C.card,
    ink: [C.fg, C.fg],
    angle: FOIL_ANGLE,
    shadow: "linear-gradient(#3f3d3a, #3f3d3a)",
    frame: null,
  },
  chrome: {
    card: C.card,
    ink: SILVER,
    hostInk: BRIGHT_SILVER,
    angle: METAL_ANGLE,
    shadow:
      "linear-gradient(180deg, #82878c 0%, #2f3338 45%, #9b9fa3 55%, #393e42 100%)",
    frame: { stops: SILVER_FRAME, angle: METAL_ANGLE, width: 5, opacity: 0.75 },
  },
  holo: {
    card: C.card,
    ink: FOIL,
    angle: FOIL_ANGLE,
    shadow: CHROME,
    frame: { stops: FOIL_FRAME, angle: FOIL_ANGLE, width: 5, opacity: 0.75 },
  },
  prismatic: {
    card: C.card,
    ink: FOIL,
    angle: FOIL_ANGLE,
    shadow:
      "linear-gradient(180deg, #fddb7c 0%, #925a25 42%, #fff6c8 58%, #c18434 100%)",
    frame: { stops: GOLD_FRAME, angle: METAL_ANGLE, width: 9, opacity: 1 },
  },
};

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

const FACET_SIZE = 26;
const SHEAR = 0.57735;
const STRETCH = 1.1547;
const STOCK_RGB = [0.106, 0.099, 0.094] as const;
const TINT = [0.96, 0.98, 1.05] as const;

/** One facet of the prismatic foil at rest: the colour of the shader in prism-foil.tsx, taken at the facet's centre. */
const facetFill = (x: number, y: number, facet: number, up: number) => {
  const hx = 0.24 - (x / W - 0.5) * 0.62;
  const hy = -0.16 - (y / H - 0.5) * 0.33;
  const angle = 0.8 + (facet - 1) * 0.5 + up * 0.25;
  const gx = Math.cos(angle);
  const gy = Math.sin(angle);
  const shift = (facet - 1) * 0.05;
  const t = (Math.abs(gx * (hx + shift) + gy * (hy + shift)) * 1500) / 900;
  const mirror = 0.4 * Math.exp(-((gx * hx + gy * hy - 0.2) ** 2) * 40);
  const raw = [0, 0.33, 0.67].map(
    (phase) => (0.5 + 0.5 * Math.cos(2 * Math.PI * (t + phase)) + mirror) * 0.72
  );
  const luma =
    (raw[0] ?? 0) * 0.3 + (raw[1] ?? 0) * 0.59 + (raw[2] ?? 0) * 0.11;
  const amount = (0.2 + 0.34 * Math.exp(-(hx * hx + hy * hy) * 1.6)) * 0.85;
  const channels = STOCK_RGB.map((stock, i) => {
    const pastel = (raw[i] ?? 0) * 0.62 + luma * (TINT[i] ?? 1) * 0.38;
    const value = Math.min(1, stock + pastel * amount);
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${channels.join("")}`;
};

const PRISM_FACETS = (() => {
  const facets: ReactElement[] = [];
  const rows = Math.ceil((H * STRETCH) / FACET_SIZE);
  const columns = Math.ceil(W / FACET_SIZE);
  const toCard = (qx: number, qy: number) => {
    const y = (qy * FACET_SIZE) / STRETCH;
    return [qx * FACET_SIZE + y * SHEAR, y] as const;
  };
  for (let row = 0; row <= rows; row += 1) {
    for (let column = -rows; column <= columns; column += 1) {
      for (const up of [0, 1]) {
        const corners =
          up === 1
            ? [
                toCard(column, row),
                toCard(column + 1, row),
                toCard(column, row + 1),
              ]
            : [
                toCard(column + 1, row),
                toCard(column + 1, row + 1),
                toCard(column, row + 1),
              ];
        const [cx, cy] = toCard(
          column + (up === 1 ? 1 / 3 : 2 / 3),
          row + (up === 1 ? 1 / 3 : 2 / 3)
        );
        if (
          cx > -FACET_SIZE &&
          cx < W + FACET_SIZE &&
          cy > -FACET_SIZE &&
          cy < H + FACET_SIZE
        ) {
          const facet = (((column + row * 2 + up) % 3) + 3) % 3;
          const fill = facetFill(cx, cy, facet, up);
          facets.push(
            <polygon
              key={`${column}:${row}:${up}`}
              points={corners.map((corner) => corner.join(",")).join(" ")}
              fill={fill}
              stroke="#000000"
              strokeOpacity="0.14"
              strokeWidth="1"
            />
          );
        }
      }
    }
  }
  return facets;
})();

/** A mask for the light on a card at rest: full at the centre, down to `edge` at `stop` of the way to the corners. */
const restMask = (id: string, stop: number, edge: number) => (
  <mask id={id}>
    <radialGradient
      id={`${id}-light`}
      gradientUnits="userSpaceOnUse"
      cx={W / 2}
      cy={H / 2}
      r={Math.hypot(W / 2, H / 2)}
    >
      <stop offset="0" stopColor="#ffffff" />
      <stop offset={stop} stopColor="#ffffff" stopOpacity={edge} />
    </radialGradient>
    <rect width={W} height={H} fill={`url(#${id}-light)`} />
  </mask>
);

/** Satori only serializes plain SVG elements inside an svg, so the stock's layers are values rather than components. */
const STOCK_LAYERS: Partial<Record<CardTier, ReactElement>> = {
  chrome: (
    <g mask="url(#lit)" opacity="0.55">
      <defs>
        {restMask("lit", 0.75, 0.25)}
        <pattern id="brush" width={W} height="6" patternUnits="userSpaceOnUse">
          <rect width={W} height="1" fill="#bbbec1" fillOpacity="0.2" />
        </pattern>
        <linearGradient
          id="sheen"
          gradientUnits="userSpaceOnUse"
          x1="-103"
          y1="127"
          x2="1303"
          y2="503"
        >
          <stop offset="0" stopColor="#cbced1" stopOpacity="0" />
          <stop offset="0.5" stopColor="#cbced1" stopOpacity="0.3" />
          <stop offset="1" stopColor="#cbced1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#brush)" />
      <rect width={W} height={H} fill="url(#sheen)" />
    </g>
  ),
  prismatic: <g>{PRISM_FACETS}</g>,
};

/** The tier's layers under the type and the foil frame over them, as on the card at rest. */
const Stock = ({ tier }: { tier: CardTier }) => {
  const { frame } = LOOKS[tier];
  const inset = frame ? FRAME_INSET + frame.width / 2 : 0;
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      {frame && (
        <defs>
          <linearGradient
            id="frame"
            gradientUnits="userSpaceOnUse"
            {...gradientLine(frame.angle, {
              x: FRAME_INSET,
              y: FRAME_INSET,
              width: W - 2 * FRAME_INSET,
              height: H - 2 * FRAME_INSET,
            })}
          >
            {frame.stops.map((stop, i) => (
              <stop
                key={i}
                offset={i / (frame.stops.length - 1)}
                stopColor={stop}
              />
            ))}
          </linearGradient>
        </defs>
      )}
      {STOCK_LAYERS[tier]}
      {frame && (
        <rect
          x={inset}
          y={inset}
          width={W - 2 * inset}
          height={H - 2 * inset}
          rx={FRAME_RADIUS - frame.width / 2}
          fill="none"
          stroke="url(#frame)"
          strokeWidth={frame.width}
          strokeOpacity={frame.opacity}
        />
      )}
    </svg>
  );
};

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
const inkText = (angle: number, stops: readonly string[]) =>
  ({
    backgroundImage: `linear-gradient(${angle}deg, ${stops.join(", ")})`,
    backgroundClip: "text",
    color: "transparent",
  }) as const;

const QrCode = ({
  url,
  stops,
  angle,
}: {
  url: string;
  stops: readonly string[];
  angle: number;
}) => {
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
      <defs>
        <linearGradient
          id="ink"
          gradientUnits="userSpaceOnUse"
          {...gradientLine(angle, { x: 0, y: 0, width: size, height: size })}
        >
          {stops.map((stop, i) => (
            <stop key={i} offset={i / (stops.length - 1)} stopColor={stop} />
          ))}
        </linearGradient>
      </defs>
      <path d={cells.join("")} fill="url(#ink)" />
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
    <path fill={C.fg} fillRule="evenodd" d={LOGO.mark} />
    <path
      fill={C.fg}
      stroke={C.fg}
      strokeWidth={LOGO.stroke}
      strokeLinejoin="round"
      d={LOGO.word}
    />
  </svg>
);

/** The score in foil ink, over a card-coloured cut and a chrome copy, as on the card. */
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
  const behind = (offset: number) =>
    ({ ...figures, position: "absolute", top: offset, left: offset }) as const;
  return (
    <div style={{ display: "flex", position: "relative" }}>
      <span
        style={{
          ...behind(CHROME_OFFSET),
          backgroundImage: look.shadow,
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {score}
      </span>
      <span style={{ ...behind(CUT_OFFSET), color: look.card }}>{score}</span>
      <span style={{ ...figures, ...inkText(look.angle, look.ink) }}>
        {score}
      </span>
    </div>
  );
};

/** The holo card's front, frozen at rest: the same marks in the same order of weight as the card on the scan page. */
export const ShareCardImage = ({ card }: { card: ShareCard }) => {
  const host = hostSize(card.host);
  const tier = tierFor(card.score);
  const look = LOOKS[tier];
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        background: look.card,
        color: C.fg,
        fontFamily: "Inter",
        fontWeight: 500,
      }}
    >
      <Stock tier={tier} />

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
          <QrCode url={card.scanUrl} stops={look.ink} angle={look.angle} />
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
              ...inkText(look.angle, look.hostInk ?? look.ink),
            }}
          >
            {card.host}
          </span>
        </div>

        <Meter value={card.score} stops={look.ink} />

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
  const image = new ImageResponse(<ShareCardImage card={card} />, {
    ...OG_SIZE,
    fonts: [
      { name: "Kanit", data: kanitBlackItalic, weight: 900, style: "italic" },
      { name: "Inter", data: interMedium, weight: 500 },
      { name: "Inter", data: interSemiBold, weight: 600 },
    ],
  });
  return image.arrayBuffer();
};
