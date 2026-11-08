import { expect, it } from "vitest";

import { percentBeaten } from "@/lib/score";

it("prints no rank until there are enough scans to compare with", () => {
  expect(percentBeaten(150, 199)).toBeNull();
  expect(percentBeaten(150, 200)).toBe(75);
});

it("prints no rank below 10%, where the figure reads as mockery", () => {
  expect(percentBeaten(19, 200)).toBeNull();
  expect(percentBeaten(20, 200)).toBe(10);
});

it("never claims to beat every site", () => {
  expect(percentBeaten(1000, 1000)).toBe(99);
});

it("rounds down, so a card never overstates the rank", () => {
  expect(percentBeaten(399, 500)).toBe(79);
});
