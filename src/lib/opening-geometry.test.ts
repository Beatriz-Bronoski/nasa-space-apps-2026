import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateOpeningTarget,
  measureOpeningTarget,
} from "./opening-geometry";

type Box = { left: number; top: number; width: number; height: number };

function reader(
  paper: Box | null,
  cover: Box | null,
  portrait = false,
): HTMLElement {
  return {
    classList: {
      contains: (name: string) => portrait && name === "book-portrait",
    },
    querySelector: (selector: string) => {
      const box = selector === ".album-flipbook" ? paper : cover;
      return box ? { getBoundingClientRect: () => box } : null;
    },
  } as unknown as HTMLElement;
}

test("measured spread targets the exact spine and preserves the cover's actual bounds", () => {
  const paper = { left: 195.5, top: 108.25, width: 880, height: 594 };
  const cover = { left: 165.5, top: 92.25, width: 940, height: 638 };
  assert.deepEqual(measureOpeningTarget(reader(paper, cover)), {
    x: 635.5,
    y: 108.25,
    width: 440,
    height: 594,
    portrait: false,
    case: cover,
  });
});

test("measured portrait targets the single page's left edge without halving it", () => {
  const paper = { left: 26, top: 83.5, width: 323, height: 436.05 };
  const cover = { left: 16, top: 72.5, width: 343, height: 468.05 };
  assert.deepEqual(measureOpeningTarget(reader(paper, cover, true)), {
    x: 26,
    y: 83.5,
    width: 323,
    height: 436.05,
    portrait: true,
    case: cover,
  });
});

test("missing, zero-sized or non-finite reader geometry does not replace the flight estimate", () => {
  const good = { left: 20, top: 80, width: 600, height: 400 };
  assert.equal(measureOpeningTarget(reader(null, good)), null);
  assert.equal(measureOpeningTarget(reader(good, null)), null);
  for (const bad of [
    { ...good, width: 0 },
    { ...good, height: -1 },
    { ...good, left: Number.NaN },
    { ...good, top: Number.POSITIVE_INFINITY },
  ]) {
    assert.equal(measureOpeningTarget(reader(bad, good)), null);
    assert.equal(measureOpeningTarget(reader(good, bad)), null);
  }
});

test("fallback flight geometry stays centered and accounts for physical cover padding", () => {
  const desktop = estimateOpeningTarget(1280);
  assert.equal(desktop.portrait, false);
  assert.equal(desktop.x, 640);
  assert.equal(desktop.width, 440);
  assert.equal(desktop.height, 594);
  assert.deepEqual(desktop.case, {
    left: 170,
    top: 92,
    width: 940,
    height: 638,
  });

  const mobile = estimateOpeningTarget(375);
  assert.equal(mobile.portrait, true);
  assert.equal(mobile.width, 323);
  assert.equal(mobile.x, 26);
  assert.equal(mobile.y, 83);
  assert.equal(mobile.case.left, 16);
  assert.equal(mobile.case.top, 73);
  assert.equal(mobile.case.width, 343);
  assert.equal(mobile.case.height, mobile.height + 32);
});

test("fallback portrait/spread boundary follows available engine width, not a separate media breakpoint", () => {
  const portrait = estimateOpeningTarget(679);
  const spread = estimateOpeningTarget(680);
  assert.equal(portrait.portrait, true);
  assert.equal(portrait.y, 104);
  assert.equal(spread.portrait, false);
  assert.equal(spread.width, 280);
  assert.equal(spread.x, 340);
  assert.equal(spread.case.width, 584);
});

test("fallback geometry remains finite before a usable viewport is available", () => {
  for (const viewport of [0, -10, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.deepEqual(
      estimateOpeningTarget(viewport),
      estimateOpeningTarget(1280),
    );
  }
  const narrow = estimateOpeningTarget(160);
  assert.equal(narrow.width, 220);
  assert.ok(narrow.case.width > 0);
  assert.ok(Object.values(narrow.case).every(Number.isFinite));
});
