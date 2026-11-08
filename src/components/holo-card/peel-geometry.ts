export interface Point {
  x: number;
  y: number;
}

export interface Fold {
  /** The part of the cover still stuck to the card. */
  film: Point[];
  /** The part lifted off: the card shows through here, and the flap is this region turned about the fold. */
  cut: Point[];
  /** CSS matrix() that projects the card's box turned about the fold line, with transform-origin at 0 0. */
  matrix: [number, number, number, number, number, number];
  /** Where the fold line crosses the corner's path, and its direction toward the lifted corner, in degrees. */
  origin: Point;
  angle: number;
  /** Distance from the fold line to the lifted corner, before projection. */
  depth: number;
  /** Distance from the fold line to the farthest point of the lifted part: past the corner once the fold has pivoted. */
  span: number;
  /** How far the flap has turned: 0 flat on the card, 0.5 standing up, 1 folded flat over it. */
  turn: number;
  /** How far the corner travelled, as a share of the card's diagonal. */
  progress: number;
}

const EPSILON = 1e-6;
/** Share of the cover peeled straight along one edge before the tip may swing past the other edge. */
const PIVOT_OPENING = 0.1;
/** How far past the card's edge the tip may swing, as the slope of the steepest pull: 60° off the edge. */
const PIVOT_SLOPE = Math.tan(Math.PI / 3);

/**
 * Where the tip of a cover pulled by `pull` (px, from the bottom-right corner) can really be. A fresh corner only moves
 * into the card: pulling it outward would fold the whole cover. Once a tenth of the cover has peeled along one edge, the
 * peel front has a foothold there and the tip may swing past the other edge: pulled down, the front pivots and runs up
 * the right edge; pulled right, it runs along the bottom one.
 */
export const reachableTip = (
  width: number,
  height: number,
  pull: Point
): Point => {
  const downward = Math.max(
    0,
    (-pull.x - 2 * PIVOT_OPENING * width) * PIVOT_SLOPE
  );
  const y = Math.min(pull.y, downward);
  const rightward = Math.max(
    0,
    (-y - 2 * PIVOT_OPENING * height) * PIVOT_SLOPE
  );
  return { x: Math.min(pull.x, rightward), y };
};

/** Clips a convex polygon to the half-plane where (p - origin) · normal ≥ 0. */
const clip = (polygon: Point[], origin: Point, normal: Point): Point[] => {
  const side = (p: Point) =>
    (p.x - origin.x) * normal.x + (p.y - origin.y) * normal.y;
  const out: Point[] = [];
  for (const [index, current] of polygon.entries()) {
    const next = polygon[(index + 1) % polygon.length] ?? current;
    const a = side(current);
    const b = side(next);
    if (a >= 0) {
      out.push(current);
    }
    if (a >= 0 !== b >= 0) {
      const t = a / (a - b);
      out.push({
        x: current.x + (next.x - current.x) * t,
        y: current.y + (next.y - current.y) * t,
      });
    }
  }
  return out;
};

/**
 * Peels a width × height cover whose bottom-right corner was pulled by `pull` (px, already passed through `reachableTip`).
 *
 * A real cover lifts before it folds: over the first `liftSpan` px the flap turns from flat to folded flat, so a small
 * pull raises the corner toward the viewer instead of flipping it over at once. The flap is drawn as seen from the
 * front, so a turn of θ shortens it across the fold by 1 - cos θ; the fold line sits where that puts the corner's tip
 * exactly under the pointer. `overlap` (px) extends the film past the fold, under the flap.
 */
export const foldAt = (
  width: number,
  height: number,
  pull: Point,
  liftSpan: number,
  overlap = 0
): Fold => {
  const corner = { x: width, y: height };
  const rect = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    corner,
    { x: 0, y: height },
  ];
  const length = Math.hypot(pull.x, pull.y);
  if (length < EPSILON) {
    return {
      film: rect,
      cut: [],
      matrix: [1, 0, 0, 1, 0, 0],
      origin: corner,
      angle: 45,
      depth: 0,
      span: 0,
      turn: 0,
      progress: 0,
    };
  }
  const theta = Math.PI * Math.min(1, Math.sqrt(length / liftSpan));
  const squash = 1 - Math.cos(theta);
  const depth = length / squash;
  const normal = { x: -pull.x / length, y: -pull.y / length };
  const origin = {
    x: corner.x - normal.x * depth,
    y: corner.y - normal.y * depth,
  };
  const reach = origin.x * normal.x + origin.y * normal.y;
  const cut = clip(rect, origin, normal);
  return {
    film: clip(
      rect,
      { x: origin.x + normal.x * overlap, y: origin.y + normal.y * overlap },
      { x: -normal.x, y: -normal.y }
    ),
    cut,
    matrix: [
      1 - squash * normal.x * normal.x,
      -squash * normal.x * normal.y,
      -squash * normal.x * normal.y,
      1 - squash * normal.y * normal.y,
      squash * reach * normal.x,
      squash * reach * normal.y,
    ],
    origin,
    angle: (Math.atan2(normal.y, normal.x) * 180) / Math.PI,
    depth,
    span: Math.max(
      depth,
      ...cut.map((p) => p.x * normal.x + p.y * normal.y - reach)
    ),
    turn: theta / Math.PI,
    progress: length / Math.hypot(width, height),
  };
};

/** Where a point on the cover lands once the flap is turned. */
export const project = ({ matrix: [a, b, c, d, e, f] }: Fold, p: Point) => ({
  x: a * p.x + c * p.y + e,
  y: b * p.x + d * p.y + f,
});

export interface Grasp {
  /** The point of the cover being held. */
  point: Point;
  /** Added to the hand's position to get where that point must be. */
  offset: Point;
}

/**
 * Takes hold of a flap folded flat, under the hand. A grasp right on the crease would swing the whole flap on the
 * smallest move, so it is held as if at least `minArm` px out from the fold.
 */
export const graspAt = (fold: Fold, hand: Point, minArm: number): Grasp => {
  const normal = {
    x: Math.cos((fold.angle * Math.PI) / 180),
    y: Math.sin((fold.angle * Math.PI) / 180),
  };
  const held = project(fold, hand);
  const arm =
    (held.x - fold.origin.x) * normal.x + (held.y - fold.origin.y) * normal.y;
  const slide = Math.max(0, minArm - arm);
  return {
    point: { x: held.x + normal.x * slide, y: held.y + normal.y * slide },
    offset: { x: -normal.x * slide, y: -normal.y * slide },
  };
};

/**
 * The pull that keeps a grasped point under the hand: the fold is the line halfway between the point and where it must
 * land. Null when no fold can do it with the corner still on the lifted side.
 */
export const pullHolding = (
  width: number,
  height: number,
  { point, offset }: Grasp,
  hand: Point
): Point | null => {
  const target = { x: hand.x + offset.x, y: hand.y + offset.y };
  const span = Math.hypot(point.x - target.x, point.y - target.y);
  if (span < EPSILON) {
    return null;
  }
  const normal = {
    x: (point.x - target.x) / span,
    y: (point.y - target.y) / span,
  };
  const toCorner =
    (width - (point.x + target.x) / 2) * normal.x +
    (height - (point.y + target.y) / 2) * normal.y;
  if (toCorner <= 0) {
    return null;
  }
  return { x: -2 * toCorner * normal.x, y: -2 * toCorner * normal.y };
};

/**
 * How far the corner must travel along `direction` before the fold has passed every corner of the card. Past
 * `liftSpan` the flap lies folded flat, so this holds whenever the result exceeds it.
 */
export const clearDistance = (
  width: number,
  height: number,
  direction: Point
): number => {
  const corners = [
    { x: -width, y: -height },
    { x: 0, y: -height },
    { x: -width, y: 0 },
  ];
  return (
    2 * Math.max(...corners.map((c) => c.x * direction.x + c.y * direction.y))
  );
};

export const polygonPath = (polygon: Point[]): string =>
  polygon.length < 3
    ? "polygon(0 0, 0 0, 0 0)"
    : `polygon(${polygon.map((p) => `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`).join(", ")})`;

/** Area of a simple polygon, in square px. */
export const polygonArea = (polygon: Point[]): number => {
  let twice = 0;
  for (const [index, p] of polygon.entries()) {
    const next = polygon[(index + 1) % polygon.length] ?? p;
    twice += p.x * next.y - next.x * p.y;
  }
  return Math.abs(twice / 2);
};
