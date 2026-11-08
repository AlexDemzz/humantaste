export interface Oklch {
  l: number;
  c: number;
  h: number;
}

const COLOR_TOKEN =
  /(?:rgba?|oklch|oklab|lab|lch|hsla?|color)\([^()]*\)|#[0-9a-f]{3,8}\b/giu;

const srgbToLinear = (channel: number): number => {
  const v = channel / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const oklabToOklch = (l: number, a: number, b: number): Oklch => {
  const c = Math.hypot(a, b);
  const h = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { l, c, h };
};

export const rgbToOklch = (r: number, g: number, b: number): Oklch => {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  );
  return oklabToOklch(
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  );
};

const xyzD65ToOklch = (x: number, y: number, z: number): Oklch => {
  const l = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z);
  return oklabToOklch(
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  );
};

/** CIE Lab (D50, what Chrome serializes Tailwind v4 colours to) to OKLCH, via XYZ and a Bradford adaptation to D65. */
export const labToOklch = (lightness: number, a: number, b: number): Oklch => {
  const kappa = 24_389 / 27;
  const epsilon = 216 / 24_389;
  const fy = (lightness + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const xr = fx ** 3 > epsilon ? fx ** 3 : (116 * fx - 16) / kappa;
  const yr = lightness > kappa * epsilon ? fy ** 3 : lightness / kappa;
  const zr = fz ** 3 > epsilon ? fz ** 3 : (116 * fz - 16) / kappa;
  const [x50, y50, z50] = [xr * 0.96422, yr, zr * 0.82521];
  return xyzD65ToOklch(
    0.9554734527 * x50 - 0.0230985369 * y50 + 0.0632593087 * z50,
    -0.028369707 * x50 + 1.009995458 * y50 + 0.021041399 * z50,
    0.0123140017 * x50 - 0.0205076964 * y50 + 1.3303659366 * z50
  );
};

const hslToRgb = (
  h: number,
  s: number,
  l: number
): [number, number, number] => {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
};

const num = (token: string | undefined, percentScale = 1): number => {
  if (!token) {
    return 0;
  }
  if (token === "none") {
    return 0;
  }
  // oxlint-disable-next-line unicorn/prefer-number-coercion -- reads the number off "50%" or "120deg", which Number() turns into NaN
  const value = Number.parseFloat(token);
  return token.endsWith("%") ? (value / 100) * percentScale : value;
};

export const parseColor = (input: string): Oklch | null => {
  const value = input.trim().toLowerCase();
  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = [...hex].map((ch) => ch + ch).join("");
    }
    if (hex.length !== 6 && hex.length !== 8) {
      return null;
    }
    return rgbToOklch(
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16)
    );
  }
  const fn = value.match(/^(?<name>[a-z]+)\((?<body>.*)\)$/u)?.groups;
  if (!fn) {
    return null;
  }
  const { name, body = "" } = fn;
  const parts = body
    .replace(/\/.*$/u, "")
    .replaceAll(",", " ")
    .trim()
    .split(/\s+/u);
  switch (name) {
    case "rgb":
    case "rgba": {
      return rgbToOklch(
        num(parts[0], 255),
        num(parts[1], 255),
        num(parts[2], 255)
      );
    }
    case "hsl":
    case "hsla": {
      const [r, g, b] = hslToRgb(num(parts[0]), num(parts[1]), num(parts[2]));
      return rgbToOklch(r, g, b);
    }
    case "oklch": {
      return { l: num(parts[0]), c: num(parts[1], 0.4), h: num(parts[2]) };
    }
    case "lab": {
      return labToOklch(
        num(parts[0], 100),
        num(parts[1], 125),
        num(parts[2], 125)
      );
    }
    case "lch": {
      const c = num(parts[1], 150);
      const h = (num(parts[2]) * Math.PI) / 180;
      return labToOklch(num(parts[0], 100), c * Math.cos(h), c * Math.sin(h));
    }
    case "color": {
      // srgb and display-p3 are close enough for a hue bucket.
      const [, r, g, b] = parts;
      return rgbToOklch(num(r, 1) * 255, num(g, 1) * 255, num(b, 1) * 255);
    }
    case "oklab": {
      return oklabToOklch(
        num(parts[0]),
        num(parts[1], 0.4),
        num(parts[2], 0.4)
      );
    }
    default: {
      return null;
    }
  }
};

export const colorsIn = (css: string): Oklch[] =>
  [...css.matchAll(COLOR_TOKEN)]
    .map((m) => parseColor(m[0]))
    .filter((c): c is Oklch => c !== null);

const MIN_CHROMA = 0.08;

/** Indigo through purple: Tailwind's indigo-500 sits at hue 277, purple-500 at 304. */
export const isPurple = (color: Oklch): boolean =>
  color.c >= MIN_CHROMA && color.h >= 268 && color.h < 318;

/** Fuchsia through pink: fuchsia-500 at 322, pink-500 at 354. */
export const isPink = (color: Oklch): boolean =>
  color.c >= MIN_CHROMA && (color.h >= 318 || color.h < 8);

export const isBlue = (color: Oklch): boolean =>
  color.c >= MIN_CHROMA && color.h >= 225 && color.h < 268;

export interface ColorStop {
  color: Oklch;
  alpha: number;
}

const alphaOf = (token: string): number => {
  const slash = token.match(/\/\s*(?<alpha>[\d.]+%?)\s*\)$/u);
  const legacy = token.match(
    /^(?:rgba|hsla)\([^)]*,\s*(?<alpha>[\d.]+%?)\s*\)$/iu
  );
  const raw = slash?.groups?.alpha ?? legacy?.groups?.alpha;
  if (raw) {
    // oxlint-disable-next-line unicorn/prefer-number-coercion -- reads the number off "50%", which Number() turns into NaN
    const alpha = Number.parseFloat(raw);
    return raw.endsWith("%") ? alpha / 100 : alpha;
  }
  const hex = token.match(/^#(?:[0-9a-f]{4}|[0-9a-f]{8})$/iu);
  if (hex) {
    const digits =
      token.length === 5 ? token.slice(4, 5).repeat(2) : token.slice(7, 9);
    return Number.parseInt(digits, 16) / 255;
  }
  return 1;
};

/** Every colour in a CSS value with its alpha, so fully transparent stops can be ignored. */
export const colorStops = (css: string): ColorStop[] =>
  [...css.matchAll(COLOR_TOKEN)]
    .map((m) => ({ color: parseColor(m[0]), alpha: alphaOf(m[0]) }))
    .filter((s): s is ColorStop => s.color !== null);

/** Smallest angle between two hues, in degrees. */
export const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

const VIVID_CHROMA = 0.06;

/** True when the visible stops span more than one hue family: the rainbow wash rather than a tonal ramp of one brand colour. */
export const isMultiHue = (stops: ColorStop[], maxSpread = 40): boolean => {
  const vivid = stops.filter(
    (s) => s.alpha >= 0.1 && s.color.c >= VIVID_CHROMA
  );
  for (const [i, a] of vivid.entries()) {
    for (const b of vivid.slice(i + 1)) {
      if (hueDistance(a.color.h, b.color.h) > maxSpread) {
        return true;
      }
    }
  }
  return false;
};

export const hasVividStop = (stops: ColorStop[]): boolean =>
  stops.some((s) => s.alpha >= 0.1 && s.color.c >= VIVID_CHROMA);
