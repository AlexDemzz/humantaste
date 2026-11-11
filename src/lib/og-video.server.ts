import { applyPalette, GIFEncoder, quantize } from "gifenc";

import { OG_SIZE, renderShareCardLayers, rgbAt, sheenLine } from "./og.server";
import type { Sheen } from "./og.server";
import type { ShareCard } from "./share";

/** One turn of the sheen in 2.4 seconds. The frame after the last is the first, so the video loops without a seam. */
const FRAMES = 48;
const FRAME_MS = 50;
const RAMP = 1024;
const GIF_COLORS = 256;
/** A GIF's 256 colours cut the sheen into bands; this many levels of noise, the same in every frame, hide them. */
const DITHER = 6;

const { width: W, height: H } = OG_SIZE;

/** Interleaved gradient noise, 0 to 1: even enough over a few pixels to stand in for a dither pattern. */
const noiseAt = (x: number, y: number) =>
  (52.9829189 * ((0.06711056 * x + 0.00583715 * y) % 1)) % 1;

/**
 * Returns the painter of one frame: it multiplies the sheen onto the card's pixels, as the card's CSS does, slid
 * `turns` of a turn along its line. The card stays still: only the sheen moves.
 */
const sheenPainter = (sheen: Sheen) => {
  const ramp = new Uint8Array(RAMP * 3);
  for (let step = 0; step < RAMP; step += 1) {
    ramp.set(rgbAt(sheen.stops, step / RAMP), step * 3);
  }
  const { x1, y1, x2, y2 } = sheenLine(sheen);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const turnLength = dx * dx + dy * dy;
  return (frame: Uint8ClampedArray, card: Uint8Array, turns: number) => {
    for (let i = 0, y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1, i += 4) {
        const along = ((x - x1) * dx + (y - y1) * dy) / turnLength - turns;
        const at = Math.floor((along - Math.floor(along)) * RAMP) * 3;
        const noise = (noiseAt(x, y) - 0.5) * DITHER;
        for (let channel = 0; channel < 3; channel += 1) {
          frame[i + channel] =
            ((card[i + channel] ?? 0) * (ramp[at + channel] ?? 0)) / 255 +
            noise;
        }
        frame[i + 3] = 255;
      }
    }
  };
};

/**
 * The card lying flat while its sheen slides across it, as an animated GIF: the one moving format we can both write
 * here and hand to Cloudflare's Media Transformations, which makes the MP4. Null for a matte card, which has no sheen.
 */
export const renderShareCardGif = async (
  card: ShareCard
): Promise<Uint8Array<ArrayBuffer> | null> => {
  const layers = await renderShareCardLayers(card);
  if (!layers) {
    return null;
  }
  const paint = sheenPainter(layers.sheen);
  const frame = new Uint8ClampedArray(layers.pixels.length);
  const gif = GIFEncoder();
  for (let n = 0; n < FRAMES; n += 1) {
    paint(frame, layers.pixels, n / FRAMES);
    const palette = quantize(frame, GIF_COLORS);
    gif.writeFrame(applyPalette(frame, palette), W, H, {
      palette,
      delay: FRAME_MS,
    });
  }
  gif.finish();
  return gif.bytes();
};
