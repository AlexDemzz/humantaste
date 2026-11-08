export interface PeelEvents {
  /** The tab is grabbed and starts to lift off the card: a tiny dry plastic tick / fingernail catching the edge. */
  lift: (at?: number) => void;
  /** The film corner lands back flat on the card after a short pull. `speed` = corner speed at landing in px/s (0–3000); under ~40 px/s it should be inaudible, louder and sharper with speed: a soft plastic slap/tap, a hint of the adhesive grabbing again. */
  settle: (speed: number, at?: number) => void;
  /** The last of the film leaves the card. `speed` = how fast it was thrown in px/s (0–5000). A short final "fwip" release pop, then the thin sheet's flutter/crinkle as it flies off, decaying over ~300–500 ms; brisker and brighter with speed. */
  release: (speed: number, at?: number) => void;
}

/** Peak gain of each event at full strength; calibrated so the loudest render peaks near −6 dBFS. */
const LEVEL = { lift: 0.2, settle: 0.45, release: 0.75 };

const LIFT = {
  /** The nail catching the edge, then the film letting go of the glue this many seconds later. */
  catchToPeel: 0.018,
  /** Ringing modes of the stiff film, in Hz. */
  modes: [3600, 6200, 9100],
  modeDecay: 0.008,
};

const SETTLE = {
  /** Landing speeds in px/s: silent below `minSpeed`, full strength at `maxSpeed`. */
  minSpeed: 40,
  maxSpeed: 3000,
  /** Loudness grows as strength^curve, so slow landings stay faint but audible. */
  curve: 0.6,
  /** The slap's lowpass opens from `slapToneLow` to `slapToneHigh` Hz with speed. */
  slapToneLow: 3000,
  slapToneHigh: 9500,
  slapDecay: 0.018,
  /** The stiff film ringing against the card: modes in Hz, high and short so it ticks rather than thuds. */
  modes: [2600, 4700, 7300],
  modeDecay: 0.01,
  /** The glue grabbing the film again: a faint, short crackle after the slap (louder reads as gum). */
  grabDelay: 0.006,
  grabLength: 0.035,
  grabLevel: 0.12,
};

const RELEASE = {
  maxSpeed: 5000,
  /** The "fwip": a noise band sweeping up from `fwipFrom` Hz to `fwipTo` Hz (+ `fwipToBySpeed` at full speed). */
  fwipFrom: 1800,
  fwipTo: 3800,
  fwipToBySpeed: 2600,
  fwipLength: 0.06,
  fwipLengthBySpeed: -0.025,
  /** Flaps per second of the flying sheet, from slow to fast throws. */
  flutterRateSlow: 13,
  flutterRateFast: 30,
  /** The flutter dies away over this many seconds, from slow to fast throws. */
  flutterLengthSlow: 0.5,
  flutterLengthFast: 0.32,
  /** How many e-folds the flaps shrink by over the flutter. */
  flutterFade: 2.4,
  flutterLevel: 0.55,
  crinkleLevel: 0.9,
  /** The sheet dulls as it flies away: lowpass from these Hz down to `distanceTone`. */
  brightnessSlow: 6000,
  brightnessFast: 10_000,
  distanceTone: 3600,
};

/** Each instance draws its filters, timings and levels this far (±share) from the nominal values. */
const VARIATION = 0.12;
const NOISE_SECONDS = 2;
/** Clicks per second in the crackle buffer; their sizes follow a power law so a few stand out. */
const CRACKLE_DENSITY = 900;
const CRACKLE_SKEW = 3;
const SILENCE = 0.0001;
const TAIL = 0.004;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const vary = (n: number, amount = VARIATION) =>
  n * (1 + (Math.random() * 2 - 1) * amount);

const createNoise = (ctx: BaseAudioContext): AudioBuffer => {
  const buffer = ctx.createBuffer(
    1,
    ctx.sampleRate * NOISE_SECONDS,
    ctx.sampleRate
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

const createCrackle = (ctx: BaseAudioContext): AudioBuffer => {
  const buffer = ctx.createBuffer(
    1,
    ctx.sampleRate * NOISE_SECONDS,
    ctx.sampleRate
  );
  const data = buffer.getChannelData(0);
  const clicks = CRACKLE_DENSITY * NOISE_SECONDS;
  for (let i = 0; i < clicks; i += 1) {
    const at = Math.floor(Math.random() * (data.length - 2));
    const size = Math.random() ** CRACKLE_SKEW * (Math.random() < 0.5 ? -1 : 1);
    // A two-sample doublet carries no DC, so the crackle cannot thump.
    data[at] = size;
    data[at + 1] = -size;
  }
  return buffer;
};

/** Ramps a gain from 0 to `peak`, then decays it exponentially and lands exactly on 0. Returns when it is silent. */
const strike = (
  param: AudioParam,
  at: number,
  peak: number,
  attack: number,
  decay: number
): number => {
  const top = at + attack;
  const end = top + decay;
  param.setValueAtTime(0, at);
  param.linearRampToValueAtTime(peak, top);
  param.exponentialRampToValueAtTime(
    Math.max(peak * SILENCE, SILENCE * SILENCE),
    end
  );
  param.linearRampToValueAtTime(0, end + TAIL);
  return end + TAIL;
};

/** Collects one event's nodes and disconnects them all once its last source has ended. */
const createVoice = () => {
  const nodes: AudioNode[] = [];
  const sources: AudioScheduledSourceNode[] = [];
  return {
    add<T extends AudioNode>(node: T): T {
      nodes.push(node);
      return node;
    },
    track<T extends AudioScheduledSourceNode>(source: T): T {
      nodes.push(source);
      sources.push(source);
      return source;
    },
    seal() {
      const playing = new Set(sources);
      for (const source of sources) {
        source.addEventListener("ended", () => {
          playing.delete(source);
          if (playing.size > 0) {
            return;
          }
          for (const node of nodes) {
            node.disconnect();
          }
        });
      }
    },
  };
};

type Voice = ReturnType<typeof createVoice>;

const playBuffer = (
  source: AudioBufferSourceNode,
  start: number,
  stop: number
) => {
  // A random read position keeps every burst different.
  source.start(start, Math.random() * (NOISE_SECONDS - 0.5));
  source.stop(stop);
};

/** The flying sheet's flaps, written as one gain curve: each flap swells and dips, and the whole decays away. Returns when it is silent. */
const flap = (
  param: AudioParam,
  at: number,
  rate: number,
  length: number,
  peak: number
): number => {
  param.setValueAtTime(0, at);
  let time = at;
  while (time < at + length) {
    const period = vary(1 / rate, 0.25);
    const fade = Math.exp((-RELEASE.flutterFade * (time - at)) / length);
    const top = peak * fade * vary(0.8, 0.25);
    param.linearRampToValueAtTime(top, time + period * 0.35);
    param.linearRampToValueAtTime(top * 0.2, time + period);
    time += period;
  }
  param.linearRampToValueAtTime(0, time + TAIL);
  return time + TAIL;
};

export const createPeelEvents = (
  ctx: BaseAudioContext,
  out: AudioNode
): PeelEvents => {
  const noise = createNoise(ctx);
  const crackle = createCrackle(ctx);
  const nyquistGuard = ctx.sampleRate * 0.45;
  const tone = (hz: number) => Math.min(hz, nyquistGuard);

  const startAt = (at: number | undefined) =>
    Math.max(at ?? ctx.currentTime, ctx.currentTime);

  const bufferSource = (voice: Voice, buffer: AudioBuffer) => {
    const source = voice.track(ctx.createBufferSource());
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = buffer.duration;
    source.playbackRate.value = vary(1, 0.05);
    return source;
  };

  const filter = (
    voice: Voice,
    type: BiquadFilterType,
    frequency: number,
    q = Math.SQRT1_2,
    boost = 0
  ) => {
    const node = voice.add(ctx.createBiquadFilter());
    node.type = type;
    node.frequency.value = tone(frequency);
    node.Q.value = q;
    node.gain.value = boost;
    return node;
  };

  const gain = (voice: Voice) => {
    const node = voice.add(ctx.createGain());
    node.gain.value = 0;
    return node;
  };

  /** Short sine modes struck together: the ring of stiff plastic or card. */
  const ring = (
    voice: Voice,
    dest: AudioNode,
    modes: readonly number[],
    at: number,
    peak: number,
    decay: number
  ) => {
    for (const [index, hz] of modes.entries()) {
      const osc = voice.track(ctx.createOscillator());
      osc.frequency.value = tone(vary(hz, 0.06));
      const env = gain(voice);
      const stop = strike(
        env.gain,
        at,
        vary(peak / (index + 1), 0.3),
        0.0006,
        vary(decay / (1 + index * 0.4))
      );
      osc.connect(env).connect(dest);
      osc.start(at);
      osc.stop(stop);
    }
  };

  /** A noise burst through a filter chain under a struck envelope. */
  const burst = (
    voice: Voice,
    buffer: AudioBuffer,
    chain: readonly AudioNode[],
    dest: AudioNode,
    at: number,
    peak: number,
    attack: number,
    decay: number
  ) => {
    const source = bufferSource(voice, buffer);
    const env = gain(voice);
    let node: AudioNode = source;
    for (const next of chain) {
      node = node.connect(next);
    }
    node.connect(env).connect(dest);
    const stop = strike(env.gain, at, peak, attack, decay);
    playBuffer(source, at, stop);
  };

  const lift = (at?: number) => {
    const t = startAt(at);
    const voice = createVoice();
    const level = vary(LEVEL.lift, 0.15);

    burst(
      voice,
      noise,
      [
        filter(voice, "highpass", vary(3000)),
        filter(voice, "peaking", vary(5200), 2, 6),
      ],
      out,
      t,
      level * 0.4,
      0.0004,
      vary(0.004)
    );
    ring(voice, out, LIFT.modes, t, level * 0.6, LIFT.modeDecay);

    const peel = t + vary(LIFT.catchToPeel, 0.3);
    burst(
      voice,
      crackle,
      [filter(voice, "bandpass", vary(4600), 1.4)],
      out,
      peel,
      level * 1.2,
      0.002,
      vary(0.02)
    );
    burst(
      voice,
      noise,
      [filter(voice, "bandpass", vary(6200), 2)],
      out,
      peel,
      level * 0.5,
      0.001,
      vary(0.008)
    );
    voice.seal();
  };

  const settle = (speed: number, at?: number) => {
    if (speed < SETTLE.minSpeed) {
      return;
    }
    const t = startAt(at);
    const strength = clamp01(
      (speed - SETTLE.minSpeed) / (SETTLE.maxSpeed - SETTLE.minSpeed)
    );
    const level = vary(LEVEL.settle * strength ** SETTLE.curve, 0.1);
    const voice = createVoice();

    burst(
      voice,
      noise,
      [
        filter(voice, "highpass", vary(160)),
        filter(
          voice,
          "lowpass",
          vary(lerp(SETTLE.slapToneLow, SETTLE.slapToneHigh, strength)),
          0.9
        ),
      ],
      out,
      t,
      level,
      lerp(0.003, 0.0008, strength),
      vary(lerp(SETTLE.slapDecay, SETTLE.slapDecay * 0.6, strength))
    );
    ring(voice, out, SETTLE.modes, t, level * 0.22, SETTLE.modeDecay);

    const grab = t + vary(SETTLE.grabDelay, 0.3);
    burst(
      voice,
      crackle,
      [
        filter(voice, "highpass", vary(2800)),
        filter(voice, "peaking", vary(5000), 2, 6),
      ],
      out,
      grab,
      level * SETTLE.grabLevel * 2,
      0.004,
      vary(SETTLE.grabLength * lerp(0.6, 1, strength))
    );
    voice.seal();
  };

  const release = (speed: number, at?: number) => {
    const t = startAt(at);
    const strength = clamp01(speed / RELEASE.maxSpeed);
    const level = vary(LEVEL.release * lerp(0.45, 1, strength), 0.1);
    const voice = createVoice();

    const fwipLength = vary(
      RELEASE.fwipLength + RELEASE.fwipLengthBySpeed * strength
    );
    const sweep = filter(voice, "bandpass", vary(RELEASE.fwipFrom), 1.3);
    sweep.frequency.setValueAtTime(tone(vary(RELEASE.fwipFrom)), t);
    sweep.frequency.exponentialRampToValueAtTime(
      tone(vary(RELEASE.fwipTo + RELEASE.fwipToBySpeed * strength)),
      t + fwipLength
    );
    burst(
      voice,
      noise,
      [filter(voice, "highpass", 300), sweep],
      out,
      t,
      level,
      fwipLength * 0.55,
      fwipLength * 0.6
    );
    burst(
      voice,
      noise,
      [filter(voice, "highpass", vary(4000))],
      out,
      t + fwipLength * 0.5,
      level * 0.35,
      0.0005,
      0.004
    );

    const flutterAt = t + fwipLength * 0.7;
    const length = vary(
      lerp(RELEASE.flutterLengthSlow, RELEASE.flutterLengthFast, strength)
    );
    const rate = vary(
      lerp(RELEASE.flutterRateSlow, RELEASE.flutterRateFast, strength)
    );
    const flight = gain(voice);
    const stop = flap(flight.gain, flutterAt, rate, length, level);
    const distance = filter(
      voice,
      "lowpass",
      lerp(RELEASE.brightnessSlow, RELEASE.brightnessFast, strength)
    );
    distance.frequency.setValueAtTime(
      tone(
        vary(lerp(RELEASE.brightnessSlow, RELEASE.brightnessFast, strength))
      ),
      flutterAt
    );
    distance.frequency.exponentialRampToValueAtTime(
      vary(RELEASE.distanceTone),
      stop
    );
    flight.connect(distance).connect(out);

    const air = bufferSource(voice, noise);
    const airLevel = gain(voice);
    airLevel.gain.value = RELEASE.flutterLevel;
    air
      .connect(filter(voice, "highpass", 500))
      .connect(filter(voice, "bandpass", vary(2600), 0.7))
      .connect(airLevel)
      .connect(flight);
    playBuffer(air, flutterAt, stop);

    const crinkle = bufferSource(voice, crackle);
    const crinkleLevel = gain(voice);
    crinkleLevel.gain.value = RELEASE.crinkleLevel * lerp(1, 1.6, strength);
    crinkle
      .connect(filter(voice, "highpass", vary(2500)))
      .connect(filter(voice, "peaking", vary(5500), 2, 8))
      .connect(crinkleLevel)
      .connect(flight);
    playBuffer(crinkle, flutterAt, stop);

    voice.seal();
  };

  return { lift, settle, release };
};
