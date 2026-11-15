import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateOpeningTarget,
  getReaderLayout,
  BOOK_PAGE_RATIO,
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

test("wide album uses the available viewport while preserving its physical cover insets", () => {
  const desktop = estimateOpeningTarget(1280, 900);
  assert.equal(desktop.portrait, false);
  assert.equal(desktop.x, 640);
  assert.equal(desktop.width, 605);
  assert.equal(desktop.y, 63);
  assert.equal(desktop.case.left, 16);
  assert.equal(desktop.case.top, 46);
  assert.equal(desktop.case.width, 1248);
  assert.equal(desktop.case.height, desktop.height + 42);

  const reference = estimateOpeningTarget(1536, 1024);
  assert.equal(reference.case.width, 1500);
  assert.equal(reference.case.left, 18);
  assert.equal(reference.width, 731);
  assert.equal(reference.height, reference.width * BOOK_PAGE_RATIO);
});

test("portrait and narrow phone layouts fit their paper and cover inside the viewport", () => {
  const mobile = estimateOpeningTarget(375, 844);
  assert.equal(mobile.portrait, true);
  assert.equal(mobile.width, 329);
  assert.equal(mobile.height, 387.75);
  assert.equal(mobile.x, 23);
  assert.equal(mobile.y, 57);
  assert.equal(mobile.case.left, 12);
  assert.equal(mobile.case.top, 46);
  assert.equal(mobile.case.width, 351);
  assert.equal(mobile.case.height, mobile.height + 30);

  const smallPhone = getReaderLayout(305, 640);
  assert.equal(smallPhone.pageWidth, 259);
  assert.equal(smallPhone.minPageWidth, 259);
  assert.ok(smallPhone.caseWidth <= 305 - 24);
  assert.equal(smallPhone.caseWidth, smallPhone.pageWidth + 22);
});

test("height-limited desktop book leaves room for its toolbar and bottom action", () => {
  const short = getReaderLayout(1600, 720);
  const tall = getReaderLayout(1600, 1043);
  assert.ok(short.caseWidth < tall.caseWidth);
  assert.equal(short.pageHeight, 566);
  assert.ok(short.caseHeight + 46 + 52 + 12 <= 720);
  assert.equal(tall.caseWidth, 1500);
  assert.equal(tall.maxPageWidth, 740);
  assert.ok(tall.pageWidth <= tall.maxPageWidth);
});

test("fallback portrait/spread boundary follows paper width after cover and scene padding", () => {
  const portrait = estimateOpeningTarget(629, 900);
  const spread = estimateOpeningTarget(630, 900);
  assert.equal(portrait.portrait, true);
  assert.equal(spread.portrait, false);
  assert.equal(spread.width, 280);
  assert.equal(spread.x, 315);
  assert.equal(spread.case.width, 598);
});

test("initial geometry remains finite when viewport measurements are not yet usable", () => {
  for (const viewport of [0, -10, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.deepEqual(
      estimateOpeningTarget(viewport, 900),
      estimateOpeningTarget(1280, 900),
    );
  }
  for (const height of [0, -10, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.deepEqual(
      estimateOpeningTarget(1280, height),
      estimateOpeningTarget(1280, 900),
    );
  }
  const narrow = estimateOpeningTarget(160, 400);
  assert.ok(narrow.width > 0);
  assert.ok(narrow.case.width > 0);
  assert.ok(Object.values(narrow.case).every(Number.isFinite));
});
