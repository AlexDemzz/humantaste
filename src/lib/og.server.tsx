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
  muted: "#a19e9a",
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

/** The card's rainbow with the light at the centre: one 36% period of its 115deg gradient, in image pixels. */
const RAINBOW = (
  <linearGradient
    id="rainbow"
    gradientUnits="userSpaceOnUse"
    x1="-87"
    y1="-5"
    x2="1679"
    y2="818"
  >
    <stop offset={0} stopColor="#c13b9f" />
    <stop offset={1 / 6} stopColor="#864ad2" />
    <stop offset={2 / 6} stopColor="#3f69d3" />
    <stop offset={3 / 6} stopColor="#00a0c5" />
    <stop offset={4 / 6} stopColor="#00b29b" />
    <stop offset={5 / 6} stopColor="#9065d0" />
    <stop offset={1} stopColor="#c13b9f" />
  </linearGradient>
);

const STARS = [
  { width: 86, height: 74, cx: 20, cy: 23, r: 3, fill: "#ffffff" },
  { width: 118, height: 97, cx: 84, cy: 62, r: 2.3, fill: "#ffffff" },
  { width: 163, height: 141, cx: 68, cy: 116, r: 3.9, fill: "#ffffff" },
  { width: 201, height: 173, cx: 177, cy: 21, r: 3.2, fill: "#ffeca0" },
];

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
  prismatic: (
    <g>
      <defs>
        {RAINBOW}
        {restMask("glitter", 0.65, 0.25)}
        {restMask("wash", 0.7, 0.15)}
        {STARS.map((star) => (
          <pattern
            key={star.width}
            id={`stars-${star.width}`}
            width={star.width}
            height={star.height}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={star.cx} cy={star.cy} r={star.r} fill={star.fill} />
          </pattern>
        ))}
      </defs>
      <g mask="url(#glitter)" opacity="0.45">
        {STARS.map((star) => (
          <rect
            key={star.width}
            width={W}
            height={H}
            fill={`url(#stars-${star.width})`}
          />
        ))}
      </g>
      <rect
        width={W}
        height={H}
        fill="url(#rainbow)"
        mask="url(#wash)"
        opacity="0.3"
      />
    </g>
  ),
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

const JevLogo = () => (
  <svg width={18} height={26} viewBox="0 0 102.6 144">
    <path
      fill={C.fg}
      fillRule="evenodd"
      clipRule="evenodd"
      d="M49.119.607a4.56 4.56 0 0 1 4.558.006l.005-.006L77.11 14.128a4.57 4.57 0 0 1 2.28 3.954v24.252l20.835 12.043a4.56 4.56 0 0 1 2.29 3.955v54.072a4.56 4.56 0 0 1-2.284 3.954l-.006-.006c-.044.026-.08.052-.11.066l-.027.011-46.702 26.959a4.6 4.6 0 0 1-4.031.269l-.544-.269-23.34-13.531-.038-.022a4.58 4.58 0 0 1-2.28-3.96v-24.224L2.46 89.684h-.01l-.176-.104a4.6 4.6 0 0 1-1.34-1.186l-.006-.006a4.6 4.6 0 0 1-.642-1.203l.005-.005A4.5 4.5 0 0 1 0 85.63V31.565c0-1.633.88-3.145 2.29-3.96zm-12.28 125.279 14.262 8.265 37.707-21.758-14.274-8.249zM55.972 61.27v24.4a4.56 4.56 0 0 1-2.724 4.157l-20.962 12.148v15.992l37.685-21.731V53.164zm23.143 34.977 14.267 8.238V60.968l-14.267-8.244zm-65.407-10.61 13.883 8.029 14.25-8.249-13.85-7.996zM9.143 34.195v43.539l14.295-8.227V45.085c0-1.635.865-3.142 2.285-3.96l21.11-12.169V12.464zm23.428 35.323 13.982 8.051V61.11l-13.982-8.078zm4.563-24.427 13.873 8.029 14.278-8.243-13.883-8.007zm18.837-16.13 14.29 8.222V20.718l-14.29-8.248z"
    />
  </svg>
);

/** Our logo in the card's grey, sized like the card's foot. */
const Brand = () => (
  <svg
    width={(LOGO.width / LOGO.em) * BRAND_SIZE}
    height={LOGO_HEIGHT_EM * BRAND_SIZE}
    viewBox={LOGO.viewBox}
    style={{ marginLeft: "auto" }}
  >
    <path fill={C.muted} fillRule="evenodd" d={LOGO.mark} />
    <path
      fill={C.muted}
      stroke={C.muted}
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
            gap: 10,
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
          {card.standing && (
            <span style={{ fontSize: 30, color: C.muted, textWrap: "balance" }}>
              {card.standing}
            </span>
          )}
        </div>

        <Meter value={card.score} stops={look.ink} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: METER_GAP,
            fontSize: 26,
            color: C.muted,
          }}
        >
          {card.jev && (
            <div style={{ display: "flex", alignItems: "center" }}>
              <JevLogo />
              <span style={{ marginLeft: 6, color: C.fg }}>Jev</span>
              <span style={{ marginLeft: 7 }}>says</span>
              <span style={{ marginLeft: 7, color: C.fg }}>{card.jev}</span>
            </div>
          )}
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
