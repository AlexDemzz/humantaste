import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { RefObject } from "react";

const MAX_TILT_DEG = 12;
const STIFFNESS = 170;
const DAMPING = 22;
const REST_EPSILON = 0.001;
/** Degrees of phone tilt, either way from the resting pose, that carry the light to the card's edge. */
const GYRO_RANGE_DEG = 20;
/** Seconds for the resting pose to catch up with a new grip. */
const BASELINE_DRIFT_S = 4;
/** Long enough for the page to show the card before the motion dialog covers it. */
const MOTION_ASK_DELAY_MS = 450;
const MOTION_SKIPPED_KEY = "humantaste:motion-skipped";

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

const motionSkipped = () => {
  try {
    return sessionStorage.getItem(MOTION_SKIPPED_KEY) !== null;
  } catch {
    return false;
  }
};

const rememberMotionSkipped = () => {
  try {
    sessionStorage.setItem(MOTION_SKIPPED_KEY, "true");
  } catch {
    // Storage is blocked: the next card asks again.
  }
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
 * With `still`, the card springs flat and the light comes to rest; only the phone's gyroscope still moves it, since the
 * phone itself is tilting.
 *
 * On touch-only screens the card stays flat: --rx/--ry hold at 0deg and the phone's gyroscope moves only the light,
 * measured from the pose the phone rests in and clamped at ±20°. On iOS, a reader who hasn't decided yet gets
 * `askingMotion` as the card arrives: `allowMotion`, called from a tap, raises the browser's prompt, and `skipMotion`
 * keeps the question away for the rest of the session. Without access the light keeps its pointer behaviour.
 */
export const useTilt = (
  ref: RefObject<HTMLElement | null>,
  { still = false }: { still?: boolean } = {}
) => {
  const stillRef = useRef(still);
  const wakeRef = useRef<(() => void) | null>(null);
  const listenToGyroRef = useRef<(() => void) | null>(null);
  const [askingMotion, setAskingMotion] = useState(false);
  useLayoutEffect(() => {
    stillRef.current = still;
    wakeRef.current?.();
  }, [still]);
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
      if (stillRef.current && !gyro) {
        // A card that isn't moving reflects nothing new: the light rests until the card tilts again.
        x.target = 0.5;
        y.target = 0.5;
        active.target = 0;
      } else if (!(hovering || gyro)) {
        x.target = 0.5;
        y.target = 0.5;
      }
      step(x, dt);
      step(y, dt);
      lean.target = stillRef.current ? 0 : 1;
      step(active, dt);
      step(lean, dt);
      write();
      frame =
        settled(x) && settled(y) && settled(active) && settled(lean)
          ? 0
          : requestAnimationFrame(tick);
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
    let askTimer: ReturnType<typeof setTimeout> | undefined;
    const listenToGyro = () =>
      window.addEventListener("deviceorientation", onOrientation);
    listenToGyroRef.current = listenToGyro;
    const requestPermission = flat ? orientationPermission() : null;
    const resumeOrAsk = async (request: OrientationPermission) => {
      try {
        // Outside a tap, iOS answers only if the reader has already decided, and rejects if not.
        if ((await request()) === "granted" && !disposed) {
          listenToGyro();
        }
      } catch {
        if (!disposed && !motionSkipped()) {
          askTimer = setTimeout(
            () => setAskingMotion(true),
            MOTION_ASK_DELAY_MS
          );
        }
      }
    };
    if (requestPermission) {
      void resumeOrAsk(requestPermission);
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
      clearTimeout(askTimer);
      wakeRef.current = null;
      listenToGyroRef.current = null;
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointercancel", onLeave);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [ref]);

  const allowMotion = useCallback(async () => {
    setAskingMotion(false);
    try {
      if ((await orientationPermission()?.()) === "granted") {
        listenToGyroRef.current?.();
      }
    } catch {
      // Unavailable: the light keeps its pointer behaviour.
    }
  }, []);

  const skipMotion = useCallback(() => {
    setAskingMotion(false);
    rememberMotionSkipped();
  }, []);

  return { askingMotion, allowMotion, skipMotion };
};
