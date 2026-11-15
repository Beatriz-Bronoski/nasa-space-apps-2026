/** Positions are percentages of the page, so a design keeps its composition on every screen. */
export type StickerKind =
  | "planet"
  | "star"
  | "rocket"
  | "moon"
  | "heart"
  | "flower"
  | "earth"
  | "sparkles"
  | "stamp"
  | "rainbow";

export type PageSticker = {
  id: string;
  kind: StickerKind;
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

export type PageDesign = {
  layout: "classic" | "postcard" | "letter";
  tape: "linen" | "midnight" | "sage";
  photoTilt: number;
  stickers: PageSticker[];
};

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const numberIn = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;
const kinds: StickerKind[] = [
  "planet",
  "star",
  "rocket",
  "moon",
  "heart",
  "flower",
  "earth",
  "sparkles",
  "stamp",
  "rainbow",
];

/** Reject a damaged design as a whole instead of silently moving or dropping a decoration. */
export function isPageDesign(value: unknown): value is PageDesign {
  if (
    !object(value) ||
    !["classic", "postcard", "letter"].includes(value.layout as string) ||
    !["linen", "midnight", "sage"].includes(value.tape as string) ||
    !numberIn(value.photoTilt, -12, 12) ||
    !Array.isArray(value.stickers) ||
    value.stickers.length > 24
  )
    return false;
  const ids = new Set<string>();
  return value.stickers.every((sticker: unknown) => {
    if (
      !object(sticker) ||
      typeof sticker.id !== "string" ||
      !sticker.id.trim() ||
      sticker.id.length > 100 ||
      ids.has(sticker.id) ||
      !kinds.includes(sticker.kind as StickerKind) ||
      !numberIn(sticker.x, 0, 100) ||
      !numberIn(sticker.y, 0, 100) ||
      !numberIn(sticker.rotation, -180, 180) ||
      !numberIn(sticker.scale, 0.6, 1.6)
    )
      return false;
    ids.add(sticker.id);
    return true;
  });
}

export function clonePageDesign(design: PageDesign): PageDesign {
  return {
    ...design,
    stickers: design.stickers.map((sticker) => ({ ...sticker })),
  };
}
