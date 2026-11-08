import { useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

const MAX_TILT_DEG = 12;
const STIFFNESS = 170;
const DAMPING = 22;
const REST_EPSILON = 0.001;
/** Degrees of phone tilt, either way from the resting pose, that carry the light to the card's edge. */
const GYRO_RANGE_DEG = 20;
/** Seconds for the resting pose to catch up with a new grip. */
const BASELINE_DRIFT_S = 4;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouchOnly = () =>
  window.matchMedia("(hover: none) and (pointer: coarse)").matches;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Wraps an angle difference into -180..180, so a reading that crosses ±180 does not jump. */
const wrapDeg = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

const screenAngle = () => {
  const angle =
    window.screen.orientation?.angle ?? Number(window.orientation ?? 0);
  return ((angle % 360) + 360) % 360;
};

/**
 * The phone's tilt in screen space: x grows as the screen's right edge tips away, y as its top edge tips toward the
 * viewer. beta and gamma are measured against the device in portrait, so landscape swaps and flips them.
 */
const screenTilt = (beta: number, gamma: number, angle: number) => {
  switch (angle) {
    case 90: {
      return { x: beta, y: -gamma };
    }
    case 180: {
      return { x: -gamma, y: -beta };
    }
    case 270: {
      return { x: -beta, y: gamma };
    }
    default: {
      return { x: gamma, y: beta };
    }
  }
};

type OrientationPermission = () => Promise<PermissionState>;

/** iOS Safari only lets a page read the gyroscope after asking from a user gesture; other browsers have no such call. */
const orientationPermission = (): OrientationPermission | null => {
  if (typeof DeviceOrientationEvent === "undefined") {
    return null;
  }
  const request: unknown = Reflect.get(
    DeviceOrientationEvent,
    "requestPermission"
  );
  return typeof request === "function"
    ? () => Reflect.apply(request, DeviceOrientationEvent, [])
    : null;
};

interface Axis {
  value: number;
  velocity: number;
  target: number;
}

const axis = (value: number): Axis => ({ value, velocity: 0, target: value });

const step = (a: Axis, dt: number) => {
  const force = (a.target - a.value) * STIFFNESS - a.velocity * DAMPING;
  a.velocity += force * dt;
  a.value += a.velocity * dt;
};

const settled = (a: Axis) =>
  Math.abs(a.target - a.value) < REST_EPSILON &&
  Math.abs(a.velocity) < REST_EPSILON;

/**
 * Springs the card toward the pointer and writes the result as custom properties on the card:
 * --rx/--ry (tilt in deg), --px/--py (pointer, 0–100 %), --hyp (0 at the centre, 1 at a corner), --active (0–1).
 * With `idle`, the card sways on its own until the pointer takes over. With `still`, the card springs flat and the
 * light comes to rest; only the phone's gyroscope still moves it, since the phone itself is tilting.
 *
 * On touch-only screens the card stays flat: --rx/--ry hold at 0deg and the phone's gyroscope moves only the light,
 * measured from the pose the phone rests in and clamped at ±20°. iOS asks for gyroscope access on the first tap on the
 * card; without access the light keeps its pointer and idle behaviour.
 */
export const useTilt = (
  ref: RefObject<HTMLElement | null>,
  { idle = false, still = false }: { idle?: boolean; still?: boolean } = {}
) => {
  const idleRef = useRef(idle);
  const stillRef = useRef(still);
  const wakeRef = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    idleRef.current = idle;
    stillRef.current = still;
    wakeRef.current?.();
  }, [idle, still]);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) {
      return;
    }
    const x = axis(0.5);
    const y = axis(0.5);
    const active = axis(0);
    const lean = axis(stillRef.current ? 0 : 1);
    const flat = isTouchOnly();
    let hovering = false;
    let gyro = false;
    let baseline: { x: number; y: number; angle: number; at: number } | null =
      null;
    let frame = 0;
    let last = performance.now();
    const started = last;

    const write = () => {
      const dx = x.value - 0.5;
      const dy = y.value - 0.5;
      const tilt = flat ? 0 : 2 * MAX_TILT_DEG * lean.value;
      el.style.setProperty("--rx", `${(-dy * tilt).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(dx * tilt).toFixed(2)}deg`);
      el.style.setProperty("--px", `${(x.value * 100).toFixed(2)}%`);
      el.style.setProperty("--py", `${(y.value * 100).toFixed(2)}%`);
      el.style.setProperty(
        "--hyp",
        Math.min(1, Math.hypot(dx, dy) * 2).toFixed(3)
      );
      el.style.setProperty("--active", active.value.toFixed(3));
    };

    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const swaying = idleRef.current && !gyro;
      if (stillRef.current && !gyro) {
        // A card that isn't moving reflects nothing new: the light rests until the card tilts again.
        x.target = 0.5;
        y.target = 0.5;
        active.target = 0;
      } else if (!(hovering || gyro)) {
        const t = (now - started) / 1000;
        x.target = swaying ? 0.5 + Math.sin(t * 1.1) * 0.28 : 0.5;
        y.target = swaying ? 0.5 + Math.cos(t * 0.8) * 0.18 : 0.5;
      }
      step(x, dt);
      step(y, dt);
      lean.target = stillRef.current ? 0 : 1;
      step(active, dt);
      step(lean, dt);
      write();
      frame =
        swaying ||
        !(settled(x) && settled(y) && settled(active) && settled(lean))
          ? requestAnimationFrame(tick)
          : 0;
    };

    const wake = () => {
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    wakeRef.current = wake;

    const onMove = (event: PointerEvent) => {
      if (gyro || stillRef.current) {
        return;
      }
      const rect = el.getBoundingClientRect();
      hovering = true;
      x.target = Math.min(
        1,
        Math.max(0, (event.clientX - rect.left) / rect.width)
      );
      y.target = Math.min(
        1,
        Math.max(0, (event.clientY - rect.top) / rect.height)
      );
      active.target = 1;
      wake();
    };

    const onLeave = () => {
      hovering = false;
      if (gyro) {
        return;
      }
      x.target = 0.5;
      y.target = 0.5;
      active.target = 0;
      wake();
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) {
        return;
      }
      const angle = screenAngle();
      const pose = screenTilt(event.beta, event.gamma, angle);
      if (!baseline || baseline.angle !== angle) {
        baseline = { ...pose, angle, at: event.timeStamp };
      }
      const drift =
        1 -
        Math.exp(
          -Math.max(0, event.timeStamp - baseline.at) / 1000 / BASELINE_DRIFT_S
        );
      baseline.x += wrapDeg(pose.x - baseline.x) * drift;
      baseline.y += wrapDeg(pose.y - baseline.y) * drift;
      baseline.at = event.timeStamp;
      gyro = true;
      x.target = clamp01(
        0.5 + wrapDeg(pose.x - baseline.x) / GYRO_RANGE_DEG / 2
      );
      y.target = clamp01(
        0.5 + wrapDeg(pose.y - baseline.y) / GYRO_RANGE_DEG / 2
      );
      active.target = 1;
      wake();
    };

    let disposed = false;
    const listenToGyro = () =>
      window.addEventListener("deviceorientation", onOrientation);
    const requestPermission = flat ? orientationPermission() : null;
    const onFirstTap = async () => {
      el.removeEventListener("click", onFirstTap);
      try {
        if (
          requestPermission &&
          (await requestPermission()) === "granted" &&
          !disposed
        ) {
          listenToGyro();
        }
      } catch {
        // Denied or unavailable: the light keeps its pointer and idle behaviour.
      }
    };
    if (requestPermission) {
      el.addEventListener("click", onFirstTap);
    } else if (flat) {
      listenToGyro();
    }

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointercancel", onLeave);
    write();
    wake();
    return () => {
      disposed = true;
      wakeRef.current = null;
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointercancel", onLeave);
      el.removeEventListener("click", onFirstTap);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [ref]);
};
