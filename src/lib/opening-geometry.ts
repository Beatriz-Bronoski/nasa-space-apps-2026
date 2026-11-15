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

export const BOOK_PAGE_RATIO = 660 / 560;

export type ReaderLayout = {
  caseWidth: number;
  caseHeight: number;
  pageWidth: number;
  pageHeight: number;
  portrait: boolean;
  maxPageWidth: number;
  minPageWidth: number;
  horizontalPadding: number;
  topPadding: number;
  bottomPadding: number;
};

/** One sizing rule for the live book and the opening's initial flight estimate. */
export function getReaderLayout(
  viewportWidth: number,
  viewportHeight = 900,
): ReaderLayout {
  const width =
    Number.isFinite(viewportWidth) && viewportWidth > 0 ? viewportWidth : 1280;
  const height =
    Number.isFinite(viewportHeight) && viewportHeight > 0
      ? viewportHeight
      : 900;
  const mobile = width <= 520;
  const horizontalPadding = mobile ? 10 : 18;
  const topPadding = mobile ? 10 : 16;
  const bottomPadding = mobile ? 18 : 24;
  const mainWidth = Math.max(1, width - (mobile ? 24 : 32));
  const coverWidth = horizontalPadding * 2 + 2;
  const portrait = mainWidth - coverWidth < 560;
  const maxPageWidth = Math.min(
    740,
    Math.max(300, (height - 154) / BOOK_PAGE_RATIO),
  );
  const caseWidth = Math.max(
    1,
    Math.min(1500, mainWidth, maxPageWidth * (portrait ? 1 : 2) + coverWidth),
  );
  const pageWidth = Math.max(
    1,
    Math.min(maxPageWidth, (caseWidth - coverWidth) / (portrait ? 1 : 2)),
  );
  const pageHeight = pageWidth * BOOK_PAGE_RATIO;
  return {
    caseWidth,
    caseHeight: pageHeight + topPadding + bottomPadding + 2,
    pageWidth,
    pageHeight,
    portrait,
    maxPageWidth,
    minPageWidth: Math.min(280, pageWidth),
    horizontalPadding,
    topPadding,
    bottomPadding,
  };
}

/** Initial flight estimate, replaced by measured reader geometry before handoff. */
export function estimateOpeningTarget(
  viewportWidth: number,
  viewportHeight = 900,
): OpeningTarget {
  const width =
    Number.isFinite(viewportWidth) && viewportWidth > 0 ? viewportWidth : 1280;
  const layout = getReaderLayout(width, viewportHeight);
  const y = width <= 520 ? 57 : 63;
  return {
    x: layout.portrait ? (width - layout.pageWidth) / 2 : width / 2,
    y,
    width: layout.pageWidth,
    height: layout.pageHeight,
    portrait: layout.portrait,
    case: {
      left: (width - layout.caseWidth) / 2,
      top: y - layout.topPadding - 1,
      width: layout.caseWidth,
      height: layout.caseHeight,
    },
  };
}
