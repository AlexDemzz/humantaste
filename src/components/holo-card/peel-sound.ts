import { createPeelEvents } from "./peel-sound-events";
import type { PeelEvents } from "./peel-sound-events";
import { createPeelTear } from "./peel-sound-tear";
import type { PeelTear } from "./peel-sound-tear";

const MASTER_GAIN = 0.7;
/** Long enough for the release's flutter to finish after the cover unmounts. */
const CLOSE_AFTER_MS = 1500;

export interface PeelSound {
  /** Starts audio. Call it from a user gesture: browsers keep audio off until one. */
  wake: () => void;
  lift: () => void;
  /** `rate`: share of the card's area peeled per second; negative while the cover lies back down. */
  tear: (rate: number) => void;
  /** Silences the tearing. */
  quiet: () => void;
  settle: (speed: number) => void;
  release: (speed: number) => void;
  dispose: () => void;
}

const resume = async (ctx: AudioContext) => {
  try {
    await ctx.resume();
  } catch {
    // Still locked: the cover stays silent.
  }
};

const close = async (ctx: AudioContext) => {
  try {
    await ctx.close();
  } catch {
    // Already closed.
  }
};

/** The cover's sound: the adhesive tearing while it peels, and the tick, slap and flutter around it. */
export const createPeelSound = (): PeelSound => {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let events: PeelEvents | null = null;
  let tearing: PeelTear | null = null;

  const wake = () => {
    if (!ctx) {
      if (typeof AudioContext === "undefined") {
        return;
      }
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(ctx.destination);
      events = createPeelEvents(ctx, master);
    }
    if (ctx.state === "suspended") {
      resume(ctx);
    }
  };

  const quiet = () => {
    tearing?.stop();
    tearing = null;
  };

  return {
    wake,
    lift: () => events?.lift(),
    tear: (rate) => {
      if (!(ctx && master)) {
        return;
      }
      tearing ??= createPeelTear(ctx, master);
      tearing.update(rate);
    },
    quiet,
    settle: (speed) => events?.settle(speed),
    release: (speed) => events?.release(speed),
    dispose: () => {
      quiet();
      const closing = ctx;
      ctx = null;
      events = null;
      if (closing) {
        window.setTimeout(() => close(closing), CLOSE_AFTER_MS);
      }
    },
  };
};
