export interface PeelTear {
  /** Called every animation frame (60–120 Hz) during a drag or throw. `rate` = share of the card's area detached per second: 0 = still (silent), ~0.05–0.3 slow careful peel, ~1–3 brisk peel, up to ~8 on a fast fling. Negative = the film is being laid back down (a faint soft brush). `at` = ctx time to schedule at; defaults to ctx.currentTime. */
  update: (rate: number, at?: number) => void;
  /** Fade out within ~30 ms and release all nodes; the object is not reused. */
  stop: (at?: number) => void;
}

/*
 * Three layers, all fed from buffers baked once per instance:
 * - ticks: cracks of stiff film, one buffer source per crack, scheduled in a short look-ahead as bursts: a few cracks
 *   ratcheting a few ms apart, then silence. They carry the slow peel. Evenly scattered high clicks over a hiss read
 *   as fizzing water, so a slow peel has neither: no steady layer, and each crack keeps its mid-range body.
 * - bed: a looping train of tiny clicks, about SLIP_HZ a second but spaced at random (no pitch: an even train buzzes
 *   like tape or gum, plastic film crackles). Its playback rate and level rise with speed, so the clicks merge into a
 *   continuous dry crackle.
 * - hiss: band-passed noise whose centre and level rise with speed, the bright tearing air of a fast peel.
 * Laying the film back down only opens a quiet low-passed brush.
 */

/** Rate at which every level and the hiss centre reach their maximum. */
const MAX_RATE = 8;
/** Below this rate the ticks fade in linearly, so a creeping drag is not a flat level jump. */
const TICK_FADE_IN_RATE = 0.05;

// Levels (linear) at MAX_RATE. Together they peak around -6 dBFS.
const TICK_GAIN = 0.33;
const BED_GAIN = 0.45;
const HISS_GAIN = 0.25;
const BRUSH_GAIN = 0.035;
/** Share of TICK_GAIN the pops keep at the slowest rate, so a slow peel stays readable. */
const TICK_FLOOR = 0.95;

/** Bursts per second as soon as the film moves at all, per unit of rate on top, and their ceiling (the bed takes over). */
const SLOW_BURSTS_PER_SECOND = 11;
const BURSTS_PER_RATE = 30;
const MAX_BURSTS_PER_SECOND = 14;
/** Cracks in one burst, and the ratchet's gap between them, in seconds. */
const BURST_CRACKS = [3, 12] as const;
const BURST_GAP = [0.003, 0.011] as const;

/** Stick-slip frequency of the bed at playback rate 1, and the playback rate span from slow to MAX_RATE. */
const SLIP_HZ = 520;
const BED_PLAYBACK = [0.8, 1.5] as const;
/** Hiss band-pass centre from slow to MAX_RATE, in Hz. */
const HISS_CENTER = [4200, 9000] as const;
const HISS_Q = 0.7;
const BED_HIGHPASS_HZ = 2600;
const TICK_LOWPASS_HZ = 11_000;
const TICK_HIGHPASS_HZ = 1200;
const BRUSH_LOWPASS_HZ = 1400;
/** Laying-down rate at which the brush is fully open. */
const BRUSH_FULL_RATE = 3;

/** Speed smoothing, in seconds: rises fast, falls a bit slower, so an uneven pointer stream does not flutter. */
const SPEED_ATTACK = 0.015;
const SPEED_RELEASE = 0.035;
/** Once the input is 0, a smoothed speed below this (a rate of ~0.02) snaps to silence. */
const STILL_SPEED = 0.01;
/** Time constants of the audio-rate glides, in seconds. */
const LEVEL_GLIDE = 0.012;
const TONE_GLIDE = 0.03;
const LOOKAHEAD = 0.05;
const MAX_FRAME_GAP = 0.1;
const DEFAULT_FRAME_GAP = 1 / 60;
const STOP_GLIDE = 0.007;
const STOP_TAIL = 0.05;

const TICK_COUNT = 24;
const TICK_SLOT = 0.006;
/** A crack's decay in seconds, the cutoff of its noisy body in Hz, and how much of it is body rather than raw noise. */
const CRACK_DECAY = [0.0004, 0.0022] as const;
const CRACK_BODY_HZ = [2500, 7000] as const;
const CRACK_BODY_MIX = 0.8;
const BED_SECONDS = 2.7;
const NOISE_SECONDS = 2.1;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const between = ([low, high]: readonly [number, number], t: number) =>
  low + (high - low) * t;
const randomBetween = (low: number, high: number) =>
  low + Math.random() * (high - low);
const LOG_MAX_RATE = Math.log2(1 + MAX_RATE);
/** 0 at rest (or laying down), 1 at MAX_RATE; logarithmic so slow peels still move the needle. */
const normalize = (rate: number) =>
  clamp01(Math.log2(1 + Math.max(0, rate)) / LOG_MAX_RATE);
const denormalize = (speed: number) => 2 ** (speed * LOG_MAX_RATE) - 1;

/** One step of an attack/release follower; snaps to 0 once the input is still and the level is negligible. */
const follow = (current: number, input: number, gap: number) => {
  const timeConstant = input > current ? SPEED_ATTACK : SPEED_RELEASE;
  const next =
    current + (input - current) * (1 - Math.exp(-gap / timeConstant));
  return input === 0 && next < STILL_SPEED ? 0 : next;
};

/** A looping random envelope between `floor` and 1, with a new control point `hz` times per second. */
const wobble = (
  length: number,
  sampleRate: number,
  hz: number,
  floor: number
) => {
  const points = Math.max(2, Math.round((length / sampleRate) * hz));
  const knots = Array.from({ length: points }, () => Math.random());
  const step = length / points;
  const envelope = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const position = i / step;
    const index = Math.floor(position);
    const t = position - index;
    const eased = t * t * (3 - 2 * t);
    const a = knots[index % points] ?? 0;
    const b = knots[(index + 1) % points] ?? 0;
    envelope[i] = floor + (1 - floor) * (a + (b - a) * eased);
  }
  return envelope;
};

const normalizePeak = (data: Float32Array, peak: number) => {
  let max = 0;
  for (const sample of data) {
    max = Math.max(max, Math.abs(sample));
  }
  if (max === 0) {
    return;
  }
  const scale = peak / max;
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (data[i] ?? 0) * scale;
  }
};

/** White noise with a slow level wobble, so the hiss and the brush breathe. */
const bakeNoise = (ctx: BaseAudioContext) => {
  const length = Math.round(ctx.sampleRate * NOISE_SECONDS);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const envelope = wobble(length, ctx.sampleRate, 18, 0.55);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (envelope[i] ?? 1);
  }
  normalizePeak(data, 1);
  return buffer;
};

/** A short decaying noise burst rung through a two-pole resonator: the pop of one glue cell letting go. */
const writePop = (
  data: Float32Array,
  start: number,
  length: number,
  sampleRate: number,
  center: number,
  amplitude: number
) => {
  // Stiff film: a near-instant click with a very short ring, not a soft, damped thud.
  const exciteDecay = Math.exp(
    -1 / (randomBetween(0.00004, 0.00015) * sampleRate)
  );
  const ringDecay = Math.exp(
    -1 / (randomBetween(0.00015, 0.0005) * sampleRate)
  );
  const omega = (2 * Math.PI * center) / sampleRate;
  const a1 = 2 * ringDecay * Math.cos(omega);
  const a2 = -ringDecay * ringDecay;
  let excite = 1;
  let y1 = 0;
  let y2 = 0;
  const fadeStart = Math.floor(length * 0.75);
  for (let i = 0; i < length; i += 1) {
    const input = (Math.random() * 2 - 1) * excite;
    excite *= exciteDecay;
    const y = input * 0.8 + a1 * y1 + a2 * y2;
    y2 = y1;
    y1 = y;
    const fade = i < fadeStart ? 1 : (length - i) / (length - fadeStart);
    data[start + i] =
      (data[start + i] ?? 0) + (y * 0.7 + input * 0.5) * fade * amplitude;
  }
};

/** One crack of stiff film: a few ms of filtered noise, with no resonance to hear as a pitch or a drop. */
const writeCrack = (data: Float32Array, sampleRate: number) => {
  const decay = Math.exp(-1 / (randomBetween(...CRACK_DECAY) * sampleRate));
  const smoothing =
    1 - Math.exp((-2 * Math.PI * randomBetween(...CRACK_BODY_HZ)) / sampleRate);
  const fadeStart = Math.floor(data.length * 0.75);
  let envelope = 1;
  let body = 0;
  for (let i = 0; i < data.length; i += 1) {
    const noise = Math.random() * 2 - 1;
    body += (noise - body) * smoothing;
    const fade =
      i < fadeStart ? 1 : (data.length - i) / (data.length - fadeStart);
    data[i] =
      (body * CRACK_BODY_MIX + noise * (1 - CRACK_BODY_MIX)) * envelope * fade;
    envelope *= decay;
  }
};

/** TICK_COUNT cracks, one per TICK_SLOT, mostly small with a few loud, quietest first. */
const bakeTicks = (ctx: BaseAudioContext) => {
  const slot = Math.round(TICK_SLOT * ctx.sampleRate);
  const buffer = ctx.createBuffer(1, slot * TICK_COUNT, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const levels = Array.from(
    { length: TICK_COUNT },
    () => 0.15 + 0.85 * Math.random() ** 2.5
  ).toSorted((a, b) => a - b);
  for (const [index, level] of levels.entries()) {
    const view = data.subarray(index * slot, (index + 1) * slot);
    writeCrack(view, ctx.sampleRate);
    normalizePeak(view, level);
  }
  return buffer;
};

/** A looping train of slips about SLIP_HZ apart, with jittered spacing, uneven strength, gaps and a slow wobble. */
const bakeBed = (ctx: BaseAudioContext) => {
  const { sampleRate } = ctx;
  const length = Math.round(sampleRate * BED_SECONDS);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  const envelope = wobble(length, sampleRate, 14, 0.25);
  const period = sampleRate / SLIP_HZ;
  const popLength = Math.round(0.0012 * sampleRate);
  let position = 0;
  while (position + popLength < length) {
    const strong = Math.random() < 0.1;
    const strength = strong
      ? randomBetween(0.6, 0.85)
      : 0.15 + Math.random() ** 1.2 * 0.45;
    const level = strength * (envelope[Math.floor(position)] ?? 1);
    writePop(
      data,
      Math.floor(position),
      popLength,
      sampleRate,
      randomBetween(3000, 10_000),
      level
    );
    const gap = Math.random() < 0.04 ? Math.floor(randomBetween(2, 6)) : 1;
    // Exponential spacing (a Poisson train): irregular like a crackle, with no period to hear as a pitch.
    position += period * gap * -Math.log(1 - Math.random());
  }
  normalizePeak(data, 1);
  return buffer;
};

const loop = (ctx: BaseAudioContext, buffer: AudioBuffer) => {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
};

const filter = (
  ctx: BaseAudioContext,
  type: BiquadFilterType,
  frequency: number,
  q: number
) => {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = q;
  return node;
};

const silentGain = (ctx: BaseAudioContext) => {
  const node = ctx.createGain();
  node.gain.value = 0;
  return node;
};

/** Moves `param` toward `value` unless it is already headed there; avoids piling up identical automation events. */
const glider = (param: AudioParam, timeConstant: number) => {
  let target = param.value;
  return (value: number, at: number) => {
    if (Math.abs(value - target) < 1e-4) {
      return;
    }
    target = value;
    param.setTargetAtTime(value, at, timeConstant);
  };
};

export const createPeelTear = (
  ctx: BaseAudioContext,
  out: AudioNode
): PeelTear => {
  const tickBuffer = bakeTicks(ctx);
  const tickSlot = Math.round(TICK_SLOT * ctx.sampleRate) / ctx.sampleRate;

  const master = ctx.createGain();
  master.connect(out);

  const tickFilter = filter(ctx, "highpass", TICK_HIGHPASS_HZ, 0.6);
  const tickLowpass = filter(ctx, "lowpass", TICK_LOWPASS_HZ, 0.5);
  const ticks = silentGain(ctx);
  tickFilter.connect(tickLowpass).connect(ticks).connect(master);

  const bedSource = loop(ctx, bakeBed(ctx));
  const bedFilter = filter(ctx, "highpass", BED_HIGHPASS_HZ, 0.7);
  const bed = silentGain(ctx);
  bedSource.connect(bedFilter).connect(bed).connect(master);

  const noise = bakeNoise(ctx);
  const hissSource = loop(ctx, noise);
  const hissFilter = filter(ctx, "bandpass", HISS_CENTER[0], HISS_Q);
  const hiss = silentGain(ctx);
  hissSource.connect(hissFilter).connect(hiss).connect(master);

  const brushSource = loop(ctx, noise);
  const brushFilter = filter(ctx, "lowpass", BRUSH_LOWPASS_HZ, 0.5);
  const brush = silentGain(ctx);
  brushSource.connect(brushFilter).connect(brush).connect(master);

  const loops = [bedSource, hissSource, brushSource];
  for (const source of loops) {
    source.start(
      ctx.currentTime,
      Math.random() * (source.buffer?.duration ?? 0)
    );
  }

  const setTicks = glider(ticks.gain, LEVEL_GLIDE);
  const setBed = glider(bed.gain, LEVEL_GLIDE);
  const setHiss = glider(hiss.gain, LEVEL_GLIDE);
  const setBrush = glider(brush.gain, LEVEL_GLIDE);
  const setBedPlayback = glider(bedSource.playbackRate, TONE_GLIDE);
  const setHissCenter = glider(hissFilter.frequency, TONE_GLIDE);
  setBedPlayback(BED_PLAYBACK[0], ctx.currentTime);

  /** Smoothed normalized peel and lay-down speeds. */
  let speed = 0;
  let layDown = 0;
  let lastAt: number | undefined;
  let scheduledUntil = 0;
  let stopped = false;

  const crack = (when: number, loud: boolean) => {
    const source = ctx.createBufferSource();
    source.buffer = tickBuffer;
    const quietest = loud ? Math.floor(TICK_COUNT / 2) : 0;
    const slot = quietest + Math.floor(Math.random() * (TICK_COUNT - quietest));
    source.playbackRate.value = randomBetween(0.97, 1.03) * (1 + 0.1 * speed);
    source.connect(tickFilter);
    source.addEventListener("ended", () => source.disconnect(), { once: true });
    source.start(when, slot * tickSlot, tickSlot);
  };

  const burst = (when: number) => {
    const cracks = Math.round(randomBetween(...BURST_CRACKS));
    let time = when;
    for (let index = 0; index < cracks; index += 1) {
      crack(time, index === 0);
      time += randomBetween(...BURST_GAP);
    }
  };

  const scheduleBursts = (
    from: number,
    to: number,
    peel: number,
    moving: number
  ) => {
    const density = Math.min(
      MAX_BURSTS_PER_SECOND,
      SLOW_BURSTS_PER_SECOND * moving + BURSTS_PER_RATE * peel
    );
    if (density <= 0) {
      return;
    }
    // Poisson arrivals: memoryless, so the overshoot past `to` can be dropped and redrawn on the next frame.
    let time = from - Math.log(1 - Math.random()) / density;
    while (time < to) {
      burst(time);
      time -= Math.log(1 - Math.random()) / density;
    }
  };

  const update = (rate: number, at = ctx.currentTime) => {
    if (stopped) {
      return;
    }
    const now = Math.max(at, ctx.currentTime);
    const gap =
      lastAt === undefined
        ? DEFAULT_FRAME_GAP
        : Math.min(MAX_FRAME_GAP, Math.max(0, now - lastAt));
    lastAt = now;

    speed = follow(speed, normalize(rate), gap);
    layDown = follow(layDown, normalize(-rate), gap);
    const peel = denormalize(speed);

    // 0 when still, 1 as soon as the film really moves: the slow floor of every layer rides on it.
    const moving = clamp01(peel / TICK_FADE_IN_RATE);
    const tickLevel = moving * (TICK_FLOOR + (1 - TICK_FLOOR) * speed);
    const bedLevel = clamp01((speed - 0.06) / 0.7) ** 1.2;
    const hissLevel = clamp01(speed / 0.9) ** 1.8;

    setTicks(TICK_GAIN * tickLevel, now);
    setBed(BED_GAIN * bedLevel, now);
    setHiss(HISS_GAIN * hissLevel, now);
    setBrush(
      BRUSH_GAIN * clamp01(denormalize(layDown) / BRUSH_FULL_RATE) ** 0.8,
      now
    );
    setBedPlayback(between(BED_PLAYBACK, speed), now);
    setHissCenter(between(HISS_CENTER, speed), now);

    const horizon = now + LOOKAHEAD;
    scheduleBursts(Math.max(now, scheduledUntil), horizon, peel, moving);
    scheduledUntil = horizon;
  };

  const stop = (at = ctx.currentTime) => {
    if (stopped) {
      return;
    }
    stopped = true;
    const now = Math.max(at, ctx.currentTime);
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0, now, STOP_GLIDE);
    const end = now + STOP_TAIL;
    for (const source of loops) {
      source.stop(end);
    }
    bedSource.addEventListener(
      "ended",
      () => {
        for (const node of [
          ...loops,
          tickFilter,
          tickLowpass,
          bedFilter,
          hissFilter,
          brushFilter,
          ticks,
          bed,
          hiss,
          brush,
          master,
        ]) {
          node.disconnect();
        }
      },
      { once: true }
    );
  };

  return { stop, update };
};
