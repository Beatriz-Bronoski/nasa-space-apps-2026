import {
  ALBUMS,
  PEOPLE,
  type AppData,
  type Contribution,
  type CheckIn,
  type Draft,
} from "./model";

export const STORAGE_KEY = "still-here:albums:v1";
const isObject = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const text = (x: unknown, max = 12000) =>
  typeof x === "string" && x.length <= max;
const date = (x: unknown) =>
  typeof x === "string" && Number.isFinite(Date.parse(x));
const person = (x: unknown) => PEOPLE.some((p) => p.id === x);
const album = (x: unknown) => ALBUMS.some((a) => a.id === x);
const photo = (x: unknown) =>
  x === undefined ||
  (typeof x === "string" &&
    x.length < 500000 &&
    (/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x) ||
      /^\/images\/(lily|sam|maya|june)\.jpg$/.test(x)));
const identifier = (x: unknown) =>
  text(x, 100) && (x as string).trim().length > 0;
const unique = (values: string[]) => new Set(values).size === values.length;
function invalid(): never {
  throw new Error(
    "Saved data contains an invalid or duplicate record. The original browser data has not been changed.",
  );
}

const validPage = (p: unknown): p is Contribution =>
  isObject(p) &&
  identifier(p.id) &&
  album(p.albumId) &&
  person(p.authorId) &&
  (p.authorId === "alex" || p.authorId === p.albumId) &&
  text(p.title, 120) &&
  text(p.text, 10000) &&
  photo(p.photo) &&
  date(p.createdAt) &&
  ["recorded", "sent", "delivered", "answered"].includes(p.status as string) &&
  [p.sentAt, p.deliveredAt, p.answeredAt].every(
    (t) => t === undefined || date(t),
  ) &&
  (p.replyTo === undefined || identifier(p.replyTo));
const validCheckIn = (c: unknown): c is CheckIn =>
  isObject(c) &&
  identifier(c.id) &&
  person(c.profileId) &&
  date(c.createdAt) &&
  typeof c.week === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(c.week) &&
  date(c.week + "T00:00:00Z") &&
  new Date(c.week + "T00:00:00Z").toISOString().slice(0, 10) === c.week &&
  new Date(c.week + "T00:00:00Z").getUTCDay() === 1 &&
  text(c.note, 2000) &&
  [c.connection, c.loneliness, c.support].every(
    (n) => Number.isInteger(n) && Number(n) >= 1 && Number(n) <= 5,
  );
const validDraft = (d: unknown): d is Draft =>
  isObject(d) &&
  text(d.title, 120) &&
  text(d.text, 10000) &&
  photo(d.photo) &&
  (d.replyTo === undefined || identifier(d.replyTo));

/**
 * Validate the complete snapshot before rendering it. Never repair by dropping rows:
 * callers can show a recovery warning and leave the original browser value intact.
 * This function is read-only and never writes to browser storage.
 */
export function parseStoredData(raw: string): AppData {
  const v: unknown = JSON.parse(raw);
  if (
    !isObject(v) ||
    v.version !== 1 ||
    !Array.isArray(v.pages) ||
    !Array.isArray(v.checkIns) ||
    !isObject(v.drafts) ||
    !Array.isArray(v.readReplyIds)
  )
    throw new Error("Unrecognized saved data");
  if (
    !v.pages.every(validPage) ||
    !v.checkIns.every(validCheckIn) ||
    !v.readReplyIds.every(identifier)
  )
    invalid();
  const pages = v.pages as Contribution[];
  const checkIns = v.checkIns as CheckIn[];
  const readReplyIds = v.readReplyIds as string[];
  if (
    !unique(pages.map((p) => p.id)) ||
    !unique(checkIns.map((c) => c.id)) ||
    !unique(checkIns.map((c) => `${c.profileId}:${c.week}`)) ||
    !unique(readReplyIds)
  )
    invalid();
  const pageById = new Map(pages.map((p) => [p.id, p]));
  const validReply = (replyTo: string, albumId: string, authorId: string) => {
    const parent = pageById.get(replyTo);
    return (
      !!parent &&
      parent.albumId === albumId &&
      parent.authorId !== authorId &&
      (parent.status === "delivered" || parent.status === "answered")
    );
  };
  for (const page of pages)
    if (page.replyTo && !validReply(page.replyTo, page.albumId, page.authorId))
      invalid();
  const drafts: Record<string, Draft> = {};
  for (const [key, d] of Object.entries(v.drafts)) {
    if (
      !/^(alex|lily|sam|maya|june):(lily|sam|maya|june)$/.test(key) ||
      !validDraft(d)
    )
      invalid();
    const [authorId, albumId] = key.split(":");
    if (authorId !== "alex" && authorId !== albumId) invalid();
    if (d.replyTo && !validReply(d.replyTo, albumId, authorId)) invalid();
    drafts[key] = d;
  }
  return { version: 1, pages, drafts, checkIns, readReplyIds };
}

/** Canvas re-encoding strips source metadata and keeps the queued payload small. */
export async function compressPhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPEG, PNG, or WebP photo.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Please choose a photo smaller than 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this photo.");
    context.fillStyle = "#f6f2e9";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.78, 0.64, 0.5, 0.35, 0.2]) {
      const result = canvas.toDataURL("image/jpeg", quality);
      if (result.length < 460000) return result;
    }
    throw new Error(
      "This photo has too much detail. Please choose a smaller image.",
    );
  } catch (e) {
    if (e instanceof Error && !e.message.includes("decode")) throw e;
    throw new Error("This photo could not be opened. Please try another.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
