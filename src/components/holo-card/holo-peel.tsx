import { HandGrabbingIcon, HandIcon } from "@phosphor-icons/react";
import { useId, useLayoutEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";

import {
  clearDistance,
  foldAt,
  graspAt,
  polygonArea,
  polygonPath,
  project,
  pullHolding,
  reachableTip,
} from "./peel-geometry";
import type { Fold, Grasp, Point } from "./peel-geometry";
import { createPeelSound } from "./peel-sound";

/** The card is 1200 units wide, like the share image. */
const CARD_UNITS = 1200;
/** Where the hand holds the tab, past the corner along the diagonal, in card units. */
const TAB_GRIP_UNITS = 28;
/** Share of the diagonal over which the flap turns from flat to folded flat: the corner lifts before it folds over. */
const LIFT_SPAN = 0.05;
/** Share of the lift span a hover pulls: the tab rises a little and nothing turns over. */
const HOVER_LIFT = 0.04;
const HINT_REACH = 0.3;
const HINT_DELAY_MS = 500;
const HINT_GAP_MS = 2400;
const HINT_COUNT = 3;
/** The hint's beats, in ms from its start: the hand comes in, grabs, pulls, holds, lets go and leaves. */
const HINT = { grab: 450, pull: 600, hold: 1500, release: 1700, gone: 2100 };
const HAND_APPROACH = { x: 30, y: 36 };
const HAND_GRAB_SCALE = 0.9;
/** Share of the cover peeled at which the rest lets go by itself; short of it, the cover stays where the hand left it. */
const FINISH_SHARE = 0.9;
/** Share of the diagonal a grasp on the flap's back is held from the fold, at the least. */
const GRASP_ARM = 0.08;
const TAP_SLOP_PX = 4;
const TAP_MS = 300;
const VELOCITY_WINDOW_MS = 80;
/** The cover fades over the last share of the diagonal before it clears the card. */
const FADE_SPAN = 0.5;
const SNAP = { stiffness: 420, damping: 34 };
const THROW = { stiffness: 90, damping: 15 };
const THROW_OVERSHOOT = 1.2;
const REST_EPSILON = 0.05;
/** Turns per second at which the plastic's sheen is at its brightest; at rest it has none. */
const SHEEN_TURN_SPEED = 1.5;
/** How fast the sheen follows the flap's turning speed, per second. */
const SHEEN_RESPONSE = 12;
const SHEEN_EPSILON = 0.01;
/** The cover overlaps the lifted part by this much at the fold, so no hairline of the card shows along it. */
const FOLD_OVERLAP_PX = 0.75;
/** Share of the card that must be on screen before the hand starts showing the gesture. */
const HINT_VISIBLE = 0.6;
/** Within this many px of where it rests, a corner springing back has landed. */
const SETTLE_PX = 1;

type Spring = typeof SNAP;
type Mode = "rest" | "drag" | "hint" | "throw";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const length = (p: Point) => Math.hypot(p.x, p.y);
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The tab's outline in card units, with the card's bottom-right corner at 0 0. The plastic leaves the right and bottom
 * edges in two concave fillets (radius 20) and ends in a round tip (radius 20, 30 units out along the diagonal), so it
 * reads as the cover running on past the corner. The last two segments close the shape inside the card, where the
 * mask hides it.
 */
const TAB_OUTLINE =
  "M0 -36.57 A20 20 0 0 0 5.86 -22.43 L35.36 7.07 A20 20 0 0 1 35.36 35.36 A20 20 0 0 1 7.07 35.36 L-22.43 5.86 A20 20 0 0 0 -36.57 0 L-36.57 -36.57 Z";

/** The clear plastic past the corner: the cover's ink thins out onto it toward the tip. */
const PeelTab = ({
  sheenRef,
}: {
  sheenRef: RefObject<SVGPathElement | null>;
}) => {
  const id = useId();
  const ink = `${id}-ink`;
  const sheen = `${id}-sheen`;
  const card = `${id}-card`;
  return (
    <svg className="holo-peel-tab" viewBox="-80 -80 160 160">
      <defs>
        <linearGradient
          id={ink}
          gradientUnits="userSpaceOnUse"
          x1="-6"
          y1="-6"
          x2="50"
          y2="50"
        >
          <stop offset="0" className="holo-tab-ink-0" />
          <stop offset="0.3" className="holo-tab-ink-1" />
          <stop offset="0.65" className="holo-tab-ink-2" />
          <stop offset="1" className="holo-tab-ink-3" />
        </linearGradient>
        <linearGradient
          id={sheen}
          gradientUnits="userSpaceOnUse"
          x1="40"
          y1="-10"
          x2="-10"
          y2="40"
        >
          <stop offset="0.3" className="holo-tab-clear" />
          <stop offset="0.5" className="holo-tab-light" />
          <stop offset="0.7" className="holo-tab-clear" />
        </linearGradient>
        <mask
          id={card}
          maskUnits="userSpaceOnUse"
          x="-80"
          y="-80"
          width="160"
          height="160"
        >
          <rect
            x="-80"
            y="-80"
            width="160"
            height="160"
            className="holo-tab-keep"
          />
          <rect
            x="-1000"
            y="-1000"
            width="1000"
            height="1000"
            rx="36"
            className="holo-tab-cut"
          />
        </mask>
      </defs>
      <g mask={`url(#${card})`}>
        <path
          className="holo-peel-tab-body"
          d={TAB_OUTLINE}
          fill={`url(#${ink})`}
        />
        <path
          ref={sheenRef}
          className="holo-peel-sheen"
          d={TAB_OUTLINE}
          fill={`url(#${sheen})`}
        />
      </g>
    </svg>
  );
};

/** Printed on the cover beside the tab, the way packaging says how it opens. */
const PeelPrint = () => (
  <span className="holo-peel-print">
    Pull to see the score
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 3 L12 12 M12 5.5 V12 H5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

/**
 * A holo cover over a freshly scored card. The plastic runs past the bottom-right corner into a clear tab; a hand
 * shows the gesture a few times, then the reader drags the tab (or taps it, or presses it from the keyboard). The
 * corner lifts toward the viewer, then folds back over the cover; once a tenth is off, the tip can swing down or right
 * and the peel front pivots after it. At nine tenths the rest lets go and flies off; let go before that and it stays as it is, to be
 * picked up again; a corner that only lifted, with nothing folded over yet, drops back.
 * `children` is the cover's print. Under reduced motion the cover lifts at once.
 */
export const HoloPeel = ({
  children,
  onRevealed,
}: {
  children: ReactNode;
  onRevealed: () => void;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const shadeBandRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const topDimRef = useRef<HTMLDivElement>(null);
  const underRef = useRef<HTMLDivElement>(null);
  const underDimRef = useRef<HTMLDivElement>(null);
  const glossRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<SVGPathElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);
  const gripRef = useRef<HTMLButtonElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const onRevealedRef = useRef(onRevealed);
  useLayoutEffect(() => {
    onRevealedRef.current = onRevealed;
  }, [onRevealed]);

  // Laid out before the first paint, so the cover never shows a frame of unclipped layers.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const film = filmRef.current;
    const shade = shadeRef.current;
    const shadeBand = shadeBandRef.current;
    const flap = flapRef.current;
    const top = topRef.current;
    const topDim = topDimRef.current;
    const under = underRef.current;
    const underDim = underDimRef.current;
    const gloss = glossRef.current;
    const sheen = sheenRef.current;
    const tab = tabRef.current;
    const grip = gripRef.current;
    const hand = handRef.current;
    if (
      !(
        root &&
        film &&
        shade &&
        shadeBand &&
        flap &&
        top &&
        topDim &&
        under &&
        underDim &&
        gloss &&
        sheen &&
        tab &&
        grip &&
        hand
      )
    ) {
      return;
    }
    if (prefersReducedMotion()) {
      onRevealedRef.current();
      return;
    }

    let width = root.clientWidth;
    let height = root.clientHeight;
    let pull: Point = { x: 0, y: 0 };
    let velocity: Point = { x: 0, y: 0 };
    let mode: Mode = "rest";
    let hovering = false;
    /** Where the hand left a peel it did not finish: the adhesive has let go, so the cover stays there. */
    let held: Point | null = null;
    let revealed = false;
    let frame = 0;
    let last = performance.now();
    let throwing = { direction: { x: 0, y: 0 }, clear: 0 };
    let drag: {
      pointerId: number;
      start: Point;
      from: Point;
      /** Set when the hand took the flap by its back; the tab drags the corner itself. */
      grasp: Grasp | null;
      at: number;
      travel: number;
      samples: { t: number; x: number; y: number }[];
    } | null = null;
    let sheenLevel = 0;
    let lastTurn = 0;
    let pointerJustEnded = false;
    const sound = createPeelSound();
    /** On from the reader's first touch of the tab until the cover lands or leaves: the hint makes no sound. */
    let voiced = false;
    let lastArea = 0;
    let throwSpeed = 0;
    let hint: {
      started: number;
      from: Point;
      reach: Point;
      letGo: Point | null;
    } | null = null;
    let hintsLeft = HINT_COUNT;
    let hintTimer = 0;

    const diagonal = () => Math.hypot(width, height);
    const towardFarCorner = (): Point => {
      const d = diagonal();
      return { x: -width / d, y: -height / d };
    };
    const gripOut = () => (TAB_GRIP_UNITS * width) / CARD_UNITS / Math.SQRT2;
    const gripPoint = (fold: Fold) =>
      project(fold, { x: width + gripOut(), y: height + gripOut() });
    const foldNow = () =>
      foldAt(
        width,
        height,
        reachableTip(width, height, pull),
        LIFT_SPAN * diagonal(),
        FOLD_OVERLAP_PX
      );

    const measure = () => {
      width = root.clientWidth;
      height = root.clientHeight;
      const span = `${2 * diagonal()}px`;
      gloss.style.height = span;
      shadeBand.style.height = span;
    };

    const placeHand = (fold: Fold, now: number) => {
      if (!hint) {
        hand.style.opacity = "0";
        return;
      }
      const t = now - hint.started;
      const grabbing = t >= HINT.grab && t < HINT.release;
      let at = gripPoint(fold);
      let opacity = 1;
      let scale = 1;
      if (t < HINT.grab) {
        const approach = 1 - easeOut(t / HINT.grab);
        at = {
          x: at.x + HAND_APPROACH.x * approach,
          y: at.y + HAND_APPROACH.y * approach,
        };
        opacity = 1 - approach;
      } else if (t < HINT.release) {
        scale = lerp(
          1,
          HAND_GRAB_SCALE,
          easeOut(clamp01((t - HINT.grab) / (HINT.pull - HINT.grab)))
        );
      } else {
        const away = easeOut(
          clamp01((t - HINT.release) / (HINT.gone - HINT.release))
        );
        const from = hint.letGo ?? at;
        at = {
          x: from.x + HAND_APPROACH.x * away,
          y: from.y + HAND_APPROACH.y * away,
        };
        opacity = 1 - away;
      }
      hand.dataset.grab = grabbing ? "true" : "false";
      hand.style.opacity = opacity.toFixed(3);
      hand.style.transform = `translate(${at.x.toFixed(2)}px, ${at.y.toFixed(2)}px) scale(${scale.toFixed(3)})`;
    };

    /** Writes the frame. `dt` (s) is 0 outside the loop, which leaves the sheen as it was. */
    const apply = (now: number, dt: number) => {
      const fold = foldNow();
      if (dt > 0) {
        // Plastic only flashes while it turns: the sheen follows the turning speed, not the pose.
        const speed = Math.abs(fold.turn - lastTurn) / dt;
        const target = clamp01(speed / SHEEN_TURN_SPEED);
        sheenLevel += (target - sheenLevel) * Math.min(1, dt * SHEEN_RESPONSE);
      }
      lastTurn = fold.turn;
      const area = polygonArea(fold.cut) / (width * height);
      if (voiced && dt > 0) {
        sound.tear((area - lastArea) / dt);
      }
      lastArea = area;
      const cut = polygonPath(fold.cut);
      // The flap's angle out of the card's plane: what decides its light, its shadow and which face shows.
      const theta = fold.turn * Math.PI;
      const rise = Math.sin(theta);
      const faceUp = fold.turn < 0.5;
      film.style.clipPath = polygonPath(fold.film);
      top.style.clipPath = cut;
      under.style.clipPath = cut;
      shade.style.clipPath = cut;
      top.style.visibility = faceUp ? "visible" : "hidden";
      under.style.visibility = faceUp ? "hidden" : "visible";
      const matrix = `matrix(${fold.matrix.map((n) => n.toFixed(5)).join(", ")})`;
      flap.style.transform = matrix;
      flap.style.filter = `drop-shadow(0 0 ${(2 + rise * 8).toFixed(2)}px oklch(0 0 0 / ${(0.15 + rise * 0.3).toFixed(3)}))`;
      tab.style.transform = matrix;
      // The tab's own shadow, cast outward along it: it grows as the tab lifts off the page.
      tab.style.filter = `drop-shadow(0 ${(0.5 + rise * 4).toFixed(2)}px ${(1 + rise * 5).toFixed(2)}px oklch(0 0 0 / ${(0.18 + rise * 0.2).toFixed(3)}))`;
      const grabbed = gripPoint(fold);
      grip.style.transform = `translate(${(grabbed.x - width - gripOut()).toFixed(2)}px, ${(grabbed.y - height - gripOut()).toFixed(2)}px)`;
      const band = `translate(${fold.origin.x.toFixed(2)}px, ${(fold.origin.y - diagonal()).toFixed(2)}px) rotate(${fold.angle.toFixed(2)}deg)`;
      const span = `${fold.span.toFixed(2)}px`;
      gloss.style.transform = band;
      gloss.style.width = span;
      shadeBand.style.transform = band;
      shadeBand.style.width = span;
      shade.style.opacity = clamp01(fold.turn * 2).toFixed(3);
      // A face turned away from the viewer catches less light: darkest edge-on, back to full once flat again.
      topDim.style.opacity = (0.35 * (1 - Math.cos(theta))).toFixed(3);
      underDim.style.opacity = (0.5 * (1 + Math.cos(theta))).toFixed(3);
      sheen.style.opacity = (0.9 * sheenLevel).toFixed(3);
      // The flap is moving, so its foil reflects: the rainbow slides as the corner travels and holds when it stops.
      under.style.backgroundPosition = `50% 50%, ${(100 * clamp01(0.2 + fold.progress * 0.8)).toFixed(1)}% ${(100 * clamp01(0.2 + fold.progress * 0.6)).toFixed(1)}%`;
      if (mode === "throw") {
        const travelled = dot(pull, throwing.direction);
        root.style.opacity = clamp01(
          (throwing.clear - travelled) / (FADE_SPAN * diagonal())
        ).toFixed(3);
      }
      placeHand(fold, now);
    };

    const reveal = () => {
      if (revealed) {
        return;
      }
      revealed = true;
      onRevealedRef.current();
    };

    const spring = (
      target: Point,
      { stiffness, damping }: Spring,
      dt: number
    ) => {
      const force = {
        x: (target.x - pull.x) * stiffness - velocity.x * damping,
        y: (target.y - pull.y) * stiffness - velocity.y * damping,
      };
      velocity = { x: velocity.x + force.x * dt, y: velocity.y + force.y * dt };
      pull = { x: pull.x + velocity.x * dt, y: pull.y + velocity.y * dt };
    };

    const restTarget = (): Point => {
      if (held) {
        return held;
      }
      if (!hovering) {
        return { x: 0, y: 0 };
      }
      const lift = HOVER_LIFT * LIFT_SPAN * diagonal();
      const toward = towardFarCorner();
      return { x: toward.x * lift, y: toward.y * lift };
    };

    const stepHint = (now: number) => {
      if (!hint) {
        return;
      }
      const t = now - hint.started;
      if (t >= HINT.gone) {
        hint = null;
        return;
      }
      if (mode !== "hint") {
        return;
      }
      if (t >= HINT.release) {
        hint.letGo = gripPoint(foldNow());
        mode = "rest";
        velocity = { x: 0, y: 0 };
        return;
      }
      const reach = easeInOut(
        clamp01((t - HINT.pull) / (HINT.hold - HINT.pull))
      );
      pull = {
        x: lerp(hint.from.x, hint.reach.x, reach),
        y: lerp(hint.from.y, hint.reach.y, reach),
      };
    };

    const restless = () =>
      mode !== "rest" ||
      hint !== null ||
      length({ x: pull.x - restTarget().x, y: pull.y - restTarget().y }) >
        REST_EPSILON ||
      length(velocity) > REST_EPSILON ||
      sheenLevel > SHEEN_EPSILON;

    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      stepHint(now);
      if (mode === "rest") {
        spring(restTarget(), SNAP, dt);
        if (voiced && length(pull) <= length(restTarget()) + SETTLE_PX) {
          voiced = false;
          sound.quiet();
          sound.settle(length(velocity));
        }
      } else if (mode === "throw") {
        const target = throwing.clear * THROW_OVERSHOOT;
        spring(
          {
            x: throwing.direction.x * target,
            y: throwing.direction.y * target,
          },
          THROW,
          dt
        );
        if (dot(pull, throwing.direction) >= throwing.clear) {
          apply(now, dt);
          sound.quiet();
          sound.release(throwSpeed);
          voiced = false;
          reveal();
          frame = 0;
          return;
        }
      }
      apply(now, dt);
      frame = restless() ? requestAnimationFrame(tick) : 0;
    };

    const wake = () => {
      if (!frame && !revealed) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    const startHint = () => {
      if (mode !== "rest" || hintsLeft <= 0) {
        return;
      }
      hintsLeft -= 1;
      if (hintsLeft > 0) {
        hintTimer = window.setTimeout(startHint, HINT.gone + HINT_GAP_MS);
      }
      const toward = towardFarCorner();
      const reach = HINT_REACH * diagonal();
      hint = {
        started: performance.now(),
        from: pull,
        reach: { x: toward.x * reach, y: toward.y * reach },
        letGo: null,
      };
      mode = "hint";
      wake();
    };

    /** With `gracefully`, a hand mid-gesture lets go and leaves instead of vanishing. */
    const stopHints = (gracefully = false) => {
      hintsLeft = 0;
      window.clearTimeout(hintTimer);
      if (gracefully && hint && mode === "hint") {
        hint.letGo = gripPoint(foldNow());
        hint.started = performance.now() - HINT.release;
        mode = "rest";
        velocity = { x: 0, y: 0 };
        wake();
        return;
      }
      if (gracefully && hint) {
        return;
      }
      hint = null;
      hand.style.opacity = "0";
    };

    const throwOff = () => {
      stopHints();
      throwSpeed = length(velocity);
      const travelled = length(pull);
      const direction =
        travelled > 1
          ? { x: pull.x / travelled, y: pull.y / travelled }
          : towardFarCorner();
      throwing = {
        direction,
        clear: clearDistance(width, height, direction),
      };
      mode = "throw";
      wake();
    };

    const local = (event: PointerEvent): Point => {
      const rect = root.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) * width) / rect.width,
        y: ((event.clientY - rect.top) * height) / rect.height,
      };
    };

    const startDrag = (event: PointerEvent, onFlap: boolean) => {
      if (mode === "throw" || event.button !== 0) {
        return;
      }
      event.preventDefault();
      stopHints();
      grip.setPointerCapture(event.pointerId);
      const start = local(event);
      const fold = foldNow();
      pointerJustEnded = false;
      drag = {
        pointerId: event.pointerId,
        start,
        from: reachableTip(width, height, pull),
        grasp:
          onFlap && fold.turn === 1
            ? graspAt(fold, start, GRASP_ARM * diagonal())
            : null,
        at: performance.now(),
        travel: 0,
        samples: [{ t: event.timeStamp, ...start }],
      };
      mode = "drag";
      velocity = { x: 0, y: 0 };
      root.dataset.dragging = "true";
      sound.wake();
      if (!voiced) {
        sound.lift();
      }
      voiced = true;
      wake();
    };

    const onDown = (event: PointerEvent) => startDrag(event, false);
    const onFlapDown = (event: PointerEvent) => startDrag(event, true);

    /** Speed over the last moments before release; a pointer that stopped before letting go has none. */
    const releaseVelocity = (
      samples: { t: number; x: number; y: number }[],
      releasedAt: number
    ) => {
      const recent = samples.filter(
        (sample) => sample.t >= releasedAt - VELOCITY_WINDOW_MS
      );
      const [first] = recent;
      const latest = recent.at(-1);
      if (recent.length < 2 || !(first && latest) || latest.t - first.t < 1) {
        return { x: 0, y: 0 };
      }
      const seconds = (latest.t - first.t) / 1000;
      return {
        x: (latest.x - first.x) / seconds,
        y: (latest.y - first.y) / seconds,
      };
    };

    /** The last of the adhesive gave way: the cover leaves the hand at the hand's speed. */
    const finishPeel = (event: PointerEvent) => {
      if (!drag) {
        return;
      }
      velocity = releaseVelocity(drag.samples, event.timeStamp);
      const { pointerId } = drag;
      drag = null;
      delete root.dataset.dragging;
      if (grip.hasPointerCapture(pointerId)) {
        grip.releasePointerCapture(pointerId);
      }
      throwOff();
    };

    const onMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      const at = local(event);
      const moved = drag.grasp
        ? pullHolding(width, height, drag.grasp, at)
        : {
            x: drag.from.x + at.x - drag.start.x,
            y: drag.from.y + at.y - drag.start.y,
          };
      if (moved) {
        pull = reachableTip(width, height, moved);
      }
      drag.travel = Math.max(
        drag.travel,
        length({ x: at.x - drag.start.x, y: at.y - drag.start.y })
      );
      drag.samples.push({ t: event.timeStamp, ...at });
      if (polygonArea(foldNow().cut) / (width * height) >= FINISH_SHARE) {
        finishPeel(event);
        return;
      }
      wake();
    };

    const onUp = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      const cancelled = event.type !== "pointerup";
      if (!cancelled) {
        drag.samples.push({ t: event.timeStamp, ...local(event) });
      }
      // Any movement, even outward where the corner can't follow, makes it a drag and not a tap.
      const tapped =
        drag.travel < TAP_SLOP_PX && performance.now() - drag.at < TAP_MS;
      velocity = cancelled
        ? { x: 0, y: 0 }
        : releaseVelocity(drag.samples, event.timeStamp);
      drag = null;
      if (!cancelled) {
        // The click that follows this pointerup was already handled here.
        pointerJustEnded = true;
        window.setTimeout(() => {
          pointerJustEnded = false;
        }, 0);
      }
      delete root.dataset.dragging;
      const foldedOver = length(pull) >= LIFT_SPAN * diagonal();
      if (!cancelled && tapped && !foldedOver) {
        throwOff();
        return;
      }
      held = foldedOver ? pull : null;
      if (foldedOver) {
        velocity = { x: 0, y: 0 };
        voiced = false;
        sound.quiet();
      }
      mode = "rest";
      wake();
    };

    /** Found the tab: the hint has done its job, and the tab lifts a little. */
    const lift = () => {
      stopHints(true);
      hovering = true;
      wake();
    };
    const onEnter = (event: PointerEvent) => {
      // A touch has no hover: it only ends the hint.
      if (event.pointerType === "mouse") {
        lift();
      } else {
        stopHints(true);
      }
    };
    const onLeave = () => {
      hovering = false;
      wake();
    };
    const onClick = () => {
      // A pointer press is decided on pointerup; any other click (keyboard, assistive tech) takes the cover off.
      if (pointerJustEnded) {
        pointerJustEnded = false;
        return;
      }
      if (mode === "throw") {
        return;
      }
      sound.wake();
      voiced = true;
      throwOff();
    };

    const resize = new ResizeObserver(() => {
      measure();
      apply(performance.now(), 0);
    });
    const onScreen = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onScreen.disconnect();
          hintTimer = window.setTimeout(startHint, HINT_DELAY_MS);
        }
      },
      { threshold: HINT_VISIBLE }
    );
    onScreen.observe(root);
    resize.observe(root);
    grip.addEventListener("pointerdown", onDown);
    under.addEventListener("pointerdown", onFlapDown);
    grip.addEventListener("pointermove", onMove);
    grip.addEventListener("pointerup", onUp);
    grip.addEventListener("pointercancel", onUp);
    grip.addEventListener("lostpointercapture", onUp);
    grip.addEventListener("pointerenter", onEnter);
    grip.addEventListener("pointerleave", onLeave);
    grip.addEventListener("focus", lift);
    grip.addEventListener("blur", onLeave);
    grip.addEventListener("click", onClick);
    measure();
    apply(last, 0);

    return () => {
      cancelAnimationFrame(frame);
      sound.dispose();
      window.clearTimeout(hintTimer);
      resize.disconnect();
      onScreen.disconnect();
      grip.removeEventListener("pointerdown", onDown);
      under.removeEventListener("pointerdown", onFlapDown);
      grip.removeEventListener("pointermove", onMove);
      grip.removeEventListener("pointerup", onUp);
      grip.removeEventListener("pointercancel", onUp);
      grip.removeEventListener("lostpointercapture", onUp);
      grip.removeEventListener("pointerenter", onEnter);
      grip.removeEventListener("pointerleave", onLeave);
      grip.removeEventListener("focus", lift);
      grip.removeEventListener("blur", onLeave);
      grip.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div ref={rootRef} className="holo-peel">
      <div ref={shadeRef} className="holo-peel-shade" aria-hidden="true">
        <div ref={shadeBandRef} className="holo-peel-band" />
      </div>
      <div
        ref={filmRef}
        className="holo-side holo-back holo-peel-film"
        aria-hidden="true"
      >
        {children}
        <PeelPrint />
      </div>
      <div
        ref={tabRef}
        className="holo-peel-flap holo-peel-tab-layer"
        aria-hidden="true"
      >
        <PeelTab sheenRef={sheenRef} />
      </div>
      <div ref={flapRef} className="holo-peel-flap" aria-hidden="true">
        <div ref={topRef} className="holo-side holo-back holo-peel-top">
          {children}
          <PeelPrint />
          <div ref={topDimRef} className="holo-peel-dim" />
        </div>
        <div ref={underRef} className="holo-peel-under">
          <div ref={glossRef} className="holo-peel-band" />
          <div ref={underDimRef} className="holo-peel-dim" />
        </div>
      </div>
      <button
        ref={gripRef}
        type="button"
        className="holo-peel-grip"
        aria-label="Show the score"
      />
      <div ref={handRef} className="holo-peel-hand" aria-hidden="true">
        <span className="holo-hand-open">
          <HandIcon weight="fill" className="holo-hand-fill" />
          <HandIcon className="holo-hand-line" />
        </span>
        <span className="holo-hand-grab">
          <HandGrabbingIcon weight="fill" className="holo-hand-fill" />
          <HandGrabbingIcon className="holo-hand-line" />
        </span>
      </div>
    </div>
  );
};
