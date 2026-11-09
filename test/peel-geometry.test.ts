import { describe, expect, it } from "vitest";

import {
  clearDistance,
  foldAt,
  graspAt,
  project,
  pullHolding,
  reachableTip,
} from "@/components/holo-card/peel-geometry";
import type { Point } from "@/components/holo-card/peel-geometry";

const WIDTH = 1200;
const HEIGHT = 630;
const LIFT = 136;

const area = (polygon: Point[]) => {
  let twice = 0;
  for (const [index, p] of polygon.entries()) {
    const next = polygon[(index + 1) % polygon.length] ?? p;
    twice += p.x * next.y - next.x * p.y;
  }
  return Math.abs(twice / 2);
};

describe("peel fold", () => {
  it.each([
    { x: -300, y: -140 },
    { x: -6, y: -4 },
  ])("lands the lifted corner under the pointer (pull %o)", (pull) => {
    const tip = project(foldAt(WIDTH, HEIGHT, pull, LIFT), {
      x: WIDTH,
      y: HEIGHT,
    });
    expect(tip.x).toBeCloseTo(WIDTH + pull.x);
    expect(tip.y).toBeCloseTo(HEIGHT + pull.y);
  });

  it("splits the cover into what stays stuck and what lifts, with nothing lost", () => {
    const fold = foldAt(WIDTH, HEIGHT, { x: -500, y: -420 }, LIFT);
    expect(area(fold.film) + area(fold.cut)).toBeCloseTo(WIDTH * HEIGHT);
    expect(area(fold.cut)).toBeGreaterThan(0);
  });

  it("lifts nothing while the corner rests", () => {
    const fold = foldAt(WIDTH, HEIGHT, { x: 0, y: 0 }, LIFT);
    expect(fold.cut).toHaveLength(0);
    expect(area(fold.film)).toBeCloseTo(WIDTH * HEIGHT);
  });

  it("clears the whole card once the corner has travelled the clear distance", () => {
    const d = Math.hypot(WIDTH, HEIGHT);
    for (const direction of [
      { x: -WIDTH / d, y: -HEIGHT / d },
      { x: -1, y: 0 },
      { x: 0, y: -1 },
    ]) {
      const clear = clearDistance(WIDTH, HEIGHT, direction);
      const past = foldAt(
        WIDTH,
        HEIGHT,
        {
          x: direction.x * (clear + 1),
          y: direction.y * (clear + 1),
        },
        LIFT
      );
      const short = foldAt(
        WIDTH,
        HEIGHT,
        {
          x: direction.x * (clear - 20),
          y: direction.y * (clear - 20),
        },
        LIFT
      );
      expect(area(past.film)).toBeCloseTo(0);
      expect(area(short.film)).toBeGreaterThan(0);
    }
  });

  it("lifts the tab toward the viewer before folding it over, so a small pull never flips it", () => {
    const tab = { x: WIDTH + 20, y: HEIGHT + 20 };
    for (const step of [1, 2, 4, 8, 16, 32]) {
      const fold = foldAt(WIDTH, HEIGHT, { x: -step, y: -step }, LIFT);
      const tip = project(fold, tab);
      expect(Math.hypot(tip.x - tab.x, tip.y - tab.y)).toBeLessThan(
        3 * step * Math.SQRT2
      );
    }
    expect(foldAt(WIDTH, HEIGHT, { x: -4, y: -3 }, LIFT).turn).toBeLessThan(
      0.5
    );
    expect(foldAt(WIDTH, HEIGHT, { x: -LIFT, y: 0 }, LIFT).turn).toBe(1);
  });

  it("keeps a fresh corner on the card: pulling outward peels nothing", () => {
    expect(reachableTip(WIDTH, HEIGHT, { x: 40, y: 60 })).toEqual({
      x: 0,
      y: 0,
    });
    expect(reachableTip(WIDTH, HEIGHT, { x: -100, y: 200 }).y).toBe(0);
    expect(reachableTip(WIDTH, HEIGHT, { x: 100, y: -50 }).x).toBe(0);
  });

  it("opens the downward swing exactly when a tenth of the cover is off", () => {
    const opening = 0.2 * WIDTH;
    const atOpening = foldAt(WIDTH, HEIGHT, { x: -opening, y: 0 }, LIFT);
    expect(area(atOpening.cut) / (WIDTH * HEIGHT)).toBeCloseTo(0.1);
    expect(reachableTip(WIDTH, HEIGHT, { x: -opening, y: 80 }).y).toBe(0);
    expect(reachableTip(WIDTH, HEIGHT, { x: -opening - 100, y: 80 }).y).toBe(
      80
    );
  });

  it("pivots the peel front when the tip swings below the card, leaving the far side stuck", () => {
    const leftward = foldAt(WIDTH, HEIGHT, { x: -500, y: 0 }, LIFT);
    const swung = foldAt(
      WIDTH,
      HEIGHT,
      reachableTip(WIDTH, HEIGHT, { x: -500, y: 200 }),
      LIFT
    );
    expect(leftward.angle).toBeCloseTo(0);
    expect(swung.angle).toBeLessThan(-10);
    const cutReaches = (corner: Point) =>
      (corner.x - swung.origin.x) * Math.cos((swung.angle * Math.PI) / 180) +
      (corner.y - swung.origin.y) * Math.sin((swung.angle * Math.PI) / 180);
    expect(cutReaches({ x: WIDTH, y: 0 })).toBeGreaterThan(0);
    expect(cutReaches({ x: 0, y: 0 })).toBeLessThan(0);
    expect(cutReaches({ x: 0, y: HEIGHT })).toBeLessThan(0);
  });

  it("spans the whole lifted part with its light, even past the corner once the fold has pivoted", () => {
    const corner = foldAt(WIDTH, HEIGHT, { x: -300, y: -140 }, LIFT);
    expect(corner.span).toBeCloseTo(corner.depth);
    const pivoted = foldAt(
      WIDTH,
      HEIGHT,
      reachableTip(WIDTH, HEIGHT, { x: -500, y: 200 }),
      LIFT
    );
    expect(pivoted.span).toBeGreaterThan(pivoted.depth);
    const normal = {
      x: Math.cos((pivoted.angle * Math.PI) / 180),
      y: Math.sin((pivoted.angle * Math.PI) / 180),
    };
    const farthest = Math.max(
      ...pivoted.cut.map(
        (p) =>
          (p.x - pivoted.origin.x) * normal.x +
          (p.y - pivoted.origin.y) * normal.y
      )
    );
    expect(pivoted.span).toBeCloseTo(farthest);
  });

  it("picks up the flap by its back without moving it", () => {
    const pull = { x: -500, y: -300 };
    const fold = foldAt(WIDTH, HEIGHT, pull, LIFT);
    const hand = project(fold, { x: WIDTH - 120, y: HEIGHT - 60 });
    const again = pullHolding(WIDTH, HEIGHT, graspAt(fold, hand, 40), hand);
    expect(again?.x).toBeCloseTo(pull.x);
    expect(again?.y).toBeCloseTo(pull.y);
  });

  it("keeps the point of the flap it holds under the hand as the hand moves, pivoting the fold", () => {
    const fold = foldAt(WIDTH, HEIGHT, { x: -500, y: -300 }, LIFT);
    const point = { x: WIDTH - 120, y: HEIGHT - 60 };
    const grasp = graspAt(fold, project(fold, point), 40);
    const hand = { x: 380, y: 620 };
    const pull = pullHolding(WIDTH, HEIGHT, grasp, hand);
    expect(pull).not.toBeNull();
    const moved = foldAt(WIDTH, HEIGHT, pull as Point, LIFT);
    const landed = project(moved, point);
    expect(landed.x).toBeCloseTo(hand.x);
    expect(landed.y).toBeCloseTo(hand.y);
    expect(moved.angle).not.toBeCloseTo(fold.angle);
  });

  it("holds a grasp on the crease as if a little way out, with no jump", () => {
    const pull = { x: -500, y: -300 };
    const fold = foldAt(WIDTH, HEIGHT, pull, LIFT);
    const grasp = graspAt(fold, fold.origin, 60);
    const radians = (fold.angle * Math.PI) / 180;
    const arm =
      (grasp.point.x - fold.origin.x) * Math.cos(radians) +
      (grasp.point.y - fold.origin.y) * Math.sin(radians);
    expect(arm).toBeCloseTo(60);
    const again = pullHolding(WIDTH, HEIGHT, grasp, fold.origin);
    expect(again?.x).toBeCloseTo(pull.x);
    expect(again?.y).toBeCloseTo(pull.y);
  });

  it.each([
    { name: "back toward the corner", move: { x: 100, y: 0 } },
    { name: "down past the card", move: { x: 0, y: 180 } },
    { name: "down and right", move: { x: 65, y: 45 } },
  ])("keeps a flap held by its back under the finger, $name", ({ move }) => {
    const phone = { width: 370, height: 194.25 };
    const lift = 0.05 * Math.hypot(phone.width, phone.height);
    const start = { x: 164, y: 112 };
    const fold = foldAt(
      phone.width,
      phone.height,
      reachableTip(phone.width, phone.height, { x: -250, y: 30 }),
      lift
    );
    const grasp = graspAt(fold, start, 33);
    const steps = 40;
    for (let step = 1; step <= steps; step += 1) {
      const hand = {
        x: start.x + (move.x * step) / steps,
        y: start.y + (move.y * step) / steps,
      };
      const pull = pullHolding(phone.width, phone.height, grasp, hand);
      expect(pull).not.toBeNull();
      const landed = project(
        foldAt(
          phone.width,
          phone.height,
          reachableTip(phone.width, phone.height, pull as Point, true),
          lift
        ),
        grasp.point
      );
      expect(landed.x).toBeCloseTo(hand.x + grasp.offset.x);
      expect(landed.y).toBeCloseTo(hand.y + grasp.offset.y);
    }
  });

  it("keeps peeling a flap held by its back when the hand goes on past the swing's cap", () => {
    const card = { width: 578, height: 303 };
    const diagonal = Math.hypot(card.width, card.height);
    const lift = 0.05 * diagonal;
    const press = { x: 101, y: 252 };
    const grasp = graspAt(
      foldAt(card.width, card.height, { x: -60, y: 90 }, lift),
      press,
      0.08 * diagonal
    );
    const peeledAt = (handDown: number) => {
      const pull = pullHolding(card.width, card.height, grasp, {
        x: press.x,
        y: press.y + handDown,
      });
      const tip = reachableTip(card.width, card.height, pull as Point, true);
      expect(tip.y).toBeLessThanOrEqual(-tip.x * Math.sqrt(3) + 1e-6);
      return (
        area(foldAt(card.width, card.height, tip, lift).cut) /
        (card.width * card.height)
      );
    };
    expect(peeledAt(360)).toBeGreaterThanOrEqual(0.9);
    expect(peeledAt(200)).toBeGreaterThan(peeledAt(100) + 0.05);
  });

  it("lays the cover back down once the hand is past where the flap came from", () => {
    const grasp = {
      point: { x: 100, y: 100 },
      offset: { x: 0, y: 0 },
    };
    const pull = pullHolding(WIDTH, HEIGHT, grasp, { x: 1100, y: 500 });
    expect(pull?.x).toBeCloseTo(0);
    expect(pull?.y).toBeCloseTo(0);
  });

  it("still holds a tab pull to the opening rule until the flap is held by its back", () => {
    const pull = { x: -100, y: 60 };
    expect(reachableTip(WIDTH, HEIGHT, pull).y).toBe(0);
    expect(reachableTip(WIDTH, HEIGHT, pull, true)).toEqual(pull);
  });

  it("caps the swing, so the fold never takes the whole cover at once", () => {
    const steep = reachableTip(WIDTH, HEIGHT, { x: -400, y: 5000 });
    expect(steep.y).toBeLessThan(600);
    const fold = foldAt(WIDTH, HEIGHT, steep, LIFT);
    expect(area(fold.film)).toBeGreaterThan(0);
  });
});
