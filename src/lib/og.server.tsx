import { encode } from "uqr";

import kanitBlackItalic from "../../assets/fonts/display/Kanit-BlackItalic.ttf?arraybuffer";
import interMedium from "../../assets/fonts/og/Inter-Medium.ttf?arraybuffer";
import interSemiBold from "../../assets/fonts/og/Inter-SemiBold.ttf?arraybuffer";
import type { ShareCard } from "./share";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
/** A scan is cached on disk until it is rescanned, so its card can sit at the edge for a day. */
export const OG_CACHE = "public, max-age=3600, s-maxage=86400";

/** The card's dark tokens from holo-card.css and styles.css, in hex: the renderer has no oklch(). */
const C = {
  card: "#191715",
  fg: "#f0eeec",
  muted: "#a19e9a",
  tickOff: "#343230",
};

/** The foil ink's stops, frozen in the order the tilted card shows them at rest. */
const INK = ["#ffcf77", "#f4a5ec", "#a0baff", "#76e2e7", "#adeb9f"];
const ink = (angle: number, stops: readonly string[] = INK) =>
  `linear-gradient(${angle}deg, ${stops.join(", ")})`;

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
const BRAND_MARK = 32;

/** The chrome copy's gradient at rest, where the card shows its dark band just above the middle. */
const CHROME =
  "linear-gradient(180deg, #b5b9be 0%, #4b4f55 42%, #eceef0 58%, #a9adb2 100%)";

const hexToRgb = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  // oxlint-disable-next-line no-bitwise -- unpacks the red, green and blue bytes of a packed #rrggbb value
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** The ink's colour a fraction `t` of the way along its stops. */
const inkAt = (t: number): string => {
  const span = (INK.length - 1) * Math.min(1, Math.max(0, t));
  const index = Math.min(INK.length - 2, Math.floor(span));
  const from = hexToRgb(INK[index] ?? "#ffffff");
  const to = hexToRgb(INK[index + 1] ?? "#ffffff");
  const mix = from.map((channel, i) =>
    Math.round(channel + ((to[i] ?? channel) - channel) * (span - index))
  );
  return `rgb(${mix.join(" ")})`;
};

/** The host is the card's second voice: 64px at most, smaller when it is long. */
const hostSize = (host: string) => Math.min(64, Math.round(1100 / host.length));

/** Gradient text: the renderer paints the background through the glyphs. */
const inkText = (angle: number, stops?: readonly string[]) =>
  ({
    backgroundImage: ink(angle, stops),
    backgroundClip: "text",
    color: "transparent",
  }) as const;

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
      <defs>
        <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1">
          {INK.map((stop, i) => (
            <stop key={stop} offset={i / (INK.length - 1)} stopColor={stop} />
          ))}
        </linearGradient>
      </defs>
      <path d={cells.join("")} fill="url(#ink)" />
    </svg>
  );
};

const Meter = ({ value }: { value: number }) => {
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
            background: i < lit ? inkAt(i / (TICKS - 1)) : C.tickOff,
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

/** Our logo in the card's grey: the mark's h and ticks are cut out in the card colour, as on the card. */
const Brand = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      marginLeft: "auto",
      fontFamily: "Kanit",
      fontStyle: "italic",
      fontWeight: 900,
      fontSize: 28,
      letterSpacing: -0.025 * 28,
      color: C.muted,
    }}
  >
    <div
      style={{
        display: "flex",
        position: "relative",
        width: BRAND_MARK,
        height: BRAND_MARK,
        marginRight: 10,
        borderRadius: 8,
        background: C.muted,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 7.5,
          top: 1,
          fontSize: 19,
          lineHeight: 1,
          color: C.card,
        }}
      >
        h
      </span>
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: 7 + index * 4,
            top: 24,
            width: 2,
            height: 3,
            borderRadius: 0.5,
            background: C.card,
          }}
        />
      ))}
    </div>
    humantaste
  </div>
);

/** The score in foil ink, over a card-coloured cut and a chrome copy, as on the card. */
const Score = ({ score }: { score: number }) => {
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
          backgroundImage: CHROME,
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {score}
      </span>
      <span style={{ ...behind(CUT_OFFSET), color: C.card }}>{score}</span>
      <span style={{ ...figures, ...inkText(160, INK.slice(0, 3)) }}>
        {score}
      </span>
    </div>
  );
};

/** The holo card's front, frozen at rest: the same marks in the same order of weight as the card on the scan page. */
export const ShareCardImage = ({ card }: { card: ShareCard }) => {
  const host = hostSize(card.host);
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        background: C.card,
        color: C.fg,
        fontFamily: "Inter",
        fontWeight: 500,
      }}
    >
      {/* The foil frame: a ring of ink inset from the edge. */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          bottom: 16,
          borderRadius: 22,
          backgroundImage: ink(20),
          opacity: 0.75,
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 21,
          left: 21,
          right: 21,
          bottom: 21,
          borderRadius: 17,
          background: C.card,
        }}
      />

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
          <Score score={card.score} />
          <QrCode url={card.scanUrl} />
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
              ...inkText(90, INK.slice(0, 2)),
            }}
          >
            {card.host}
          </span>
          <span style={{ fontSize: 30, color: C.muted, textWrap: "balance" }}>
            {card.verdict}
          </span>
        </div>

        <Meter value={card.score} />

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

/** Renders the card to PNG bytes with the same renderer as our other OG images: Satori and resvg compiled to WASM. */
export const renderShareCard = async (
  card: ShareCard
): Promise<ArrayBuffer> => {
  const { ImageResponse } = await import("@cf-wasm/og/node");
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
