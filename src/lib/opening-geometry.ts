/** The opening's spine (or portrait page) and the physical cover behind it. */
export type OpeningTarget = {
  x: number;
  y: number;
  width: number;
  height: number;
  portrait: boolean;
  case: { left: number; top: number; width: number; height: number };
};

type Box = Pick<DOMRect, "left" | "top" | "width" | "height">;

function validBox(box: Box): boolean {
  return (
    [box.left, box.top, box.width, box.height].every(Number.isFinite) &&
    box.width > 0 &&
    box.height > 0
  );
}

/** Read the prepared engine, rather than guessing its final position or page size. */
export function measureOpeningTarget(
  reader: HTMLElement,
): OpeningTarget | null {
  const paper = reader.querySelector<HTMLElement>(".album-flipbook");
  const cover = reader.querySelector<HTMLElement>(".book-case");
  if (!paper || !cover) return null;
  const pageBox = paper.getBoundingClientRect();
  const caseBox = cover.getBoundingClientRect();
  if (!validBox(pageBox) || !validBox(caseBox)) return null;
  const portrait = reader.classList.contains("book-portrait");
  const width = pageBox.width / (portrait ? 1 : 2);
  return {
    x: pageBox.left + (portrait ? 0 : width),
    y: pageBox.top,
    width,
    height: pageBox.height,
    portrait,
    case: {
      left: caseBox.left,
      top: caseBox.top,
      width: caseBox.width,
      height: caseBox.height,
    },
  };
}

/** Initial flight estimate, replaced by measured reader geometry before handoff. */
export function estimateOpeningTarget(viewport: number): OpeningTarget {
  const viewportWidth =
    Number.isFinite(viewport) && viewport > 0 ? viewport : 1280;
  const mobile = viewportWidth <= 520;
  const medium = viewportWidth <= 760;
  const topPadding = mobile ? 9 : medium ? 11 : 14;
  const bottomPadding = mobile ? 21 : medium ? 24 : 28;
  const mainWidth = Math.min(1220, viewportWidth) - (mobile ? 32 : 96);
  const caseWidth = Math.max(1, Math.min(940, mainWidth));
  const available = caseWidth - topPadding * 2 - 2;
  const portrait = available < 560;
  const width = Math.max(
    220,
    Math.min(440, portrait ? available : available / 2),
  );
  const height = width * 1.35;
  const y = mobile ? 83 : medium ? 104 : 107;
  return {
    x: portrait ? (viewportWidth - width) / 2 : viewportWidth / 2,
    y,
    width,
    height,
    portrait,
    case: {
      left: (viewportWidth - caseWidth) / 2,
      top: y - topPadding - 1,
      width: caseWidth,
      height: height + topPadding + bottomPadding + 2,
    },
  };
}
