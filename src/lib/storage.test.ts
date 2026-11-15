import test from "node:test";
import assert from "node:assert/strict";
import {
  addContribution,
  advanceDelivery,
  createAlbum,
  createInitialData,
  MAX_CUSTOM_ALBUMS,
  type AppData,
  type PageDesign,
} from "./model";
import { parseStoredData } from "./storage";

const now = new Date("2026-11-14T15:00:00Z");
const saved = (): AppData => ({
  ...createInitialData(now),
  drafts: {
    "alex:lily": {
      title: "A reply in progress",
      text: "Your plant made me smile.",
      replyTo: "lily-4",
      photo: "data:image/jpeg;base64,/9j/2Q==",
    },
    "sam:sam": { title: "Our Saturday", text: "I saved a seat for you." },
  },
  checkIns: [
    {
      id: "reflection-1",
      profileId: "alex",
      week: "2026-11-09",
      createdAt: now.toISOString(),
      connection: 4,
      loneliness: 2,
      support: 5,
      note: "A quiet but good week.",
    },
  ],
  readReplyIds: ["lily-4"],
});
const parse = (data: unknown) => parseStoredData(JSON.stringify(data));
const design = (): PageDesign => ({
  layout: "postcard",
  tape: "midnight",
  photoTilt: -3,
  stickers: [
    { id: "planet-1", kind: "planet", x: 80, y: 15, rotation: -18, scale: 1.2 },
    { id: "heart-1", kind: "heart", x: 20, y: 80, rotation: 9, scale: 0.8 },
  ],
});

test("a valid saved snapshot round-trips with every page, draft, reflection and read marker intact", () => {
  const data = saved();
  const restored = parse(data);
  assert.deepEqual(restored, data);
  assert.equal(restored.pages.length, 10);
  assert.equal(Object.keys(restored.drafts).length, 2);
  assert.equal(restored.checkIns[0].note, "A quiet but good week.");
});

test("scrapbook designs round-trip on both published pages and unfinished drafts", () => {
  const data = saved();
  data.pages[0].design = design();
  data.drafts["alex:lily"].design = {
    ...design(),
    layout: "letter",
    tape: "sage",
  };
  const restored = parse(data);
  assert.deepEqual(restored, data);
  assert.equal(restored.pages[0].design!.stickers[0].x, 80);
  assert.equal(restored.drafts["alex:lily"].design!.tape, "sage");
});

test("legacy version-one snapshots without design metadata still load unchanged", () => {
  const data = saved();
  const restored = parse(data);
  assert.deepEqual(restored, data);
  assert.equal(Object.hasOwn(restored.pages[0], "design"), false);
  assert.equal(Object.hasOwn(restored.drafts["alex:lily"], "design"), false);
  assert.equal(Object.hasOwn(restored, "customAlbums"), false);
});

const customSaved = () => {
  let data = createAlbum(
    saved(),
    { personId: "lily", title: "Our garden" },
    "album-garden",
  );
  data = addContribution(
    data,
    {
      albumId: "album-garden",
      authorId: "alex",
      title: "From here",
      text: "A leaf unfolded.",
    },
    now,
  );
  data = {
    ...data,
    pages: advanceDelivery(
      advanceDelivery(data.pages, true, now),
      true,
      new Date(now.getTime() + 12_000),
    ),
  };
  const parent = data.pages.find((item) => item.albumId === "album-garden")!;
  data.drafts["lily:album-garden"] = {
    title: "From Earth",
    text: "Two leaves now.",
    replyTo: parent.id,
    design: design(),
  };
  data.drafts["alex:album-garden"] = {
    title: "Another moment",
    text: "A draft for this book.",
  };
  return addContribution(
    data,
    {
      albumId: "album-garden",
      authorId: "lily",
      title: "Your plant says hello",
      text: "Mine has grown too.",
      replyTo: parent.id,
    },
    new Date(now.getTime() + 20_000),
  );
};

test("added albums, their contributions and both participant drafts round-trip with legacy records", () => {
  const data = customSaved();
  const restored = parse(data);
  assert.deepEqual(restored, data);
  assert.equal(restored.customAlbums?.[0].title, "Our garden");
  assert.equal(
    restored.pages.filter((item) => item.albumId === "album-garden").length,
    2,
  );
  assert.equal(restored.drafts["lily:album-garden"].design?.layout, "postcard");
  assert.equal(restored.checkIns[0].note, data.checkIns[0].note);
});

test("invalid added-album metadata rejects the complete snapshot without introducing external covers or participants", () => {
  const invalidPatches = [
    { id: "lily" },
    { id: "album-bad:id" },
    { id: "album-" },
    { personId: "alex" },
    { personId: "unknown" },
    { title: "" },
    { title: " padded " },
    { title: "x".repeat(71) },
    { title: "New\nline" },
    { cover: "https://tracker.example/book.jpg" },
    { cover: "javascript:alert(1)" },
    { cover: "data:image/jpeg;base64,/9j/2Q==" },
    { cover: "/images/sam.jpg" },
    { accent: "script" },
    { subtitle: "Unvalidated metadata" },
  ];
  for (const patch of invalidPatches) {
    const data = customSaved();
    Object.assign(data.customAlbums![0], patch);
    const raw = JSON.stringify(data);
    assert.throws(() => parseStoredData(raw), /invalid or duplicate/);
    assert.equal(JSON.stringify(data), raw);
  }
  assert.throws(
    () => parse({ ...saved(), customAlbums: null }),
    /invalid or duplicate/,
  );
  const duplicate = customSaved();
  duplicate.customAlbums!.push({ ...duplicate.customAlbums![0] });
  assert.throws(() => parse(duplicate), /invalid or duplicate/);
  const tooMany = customSaved();
  tooMany.customAlbums = Array.from(
    { length: MAX_CUSTOM_ALBUMS + 1 },
    (_, index) => ({ ...tooMany.customAlbums![0], id: `album-${index}` }),
  );
  assert.throws(() => parse(tooMany), /invalid or duplicate/);
});

test("added-album pages and drafts retain participant and exact-album reply validation", () => {
  const wrongPageAuthor = customSaved();
  wrongPageAuthor.pages.find(
    (item) => item.albumId === "album-garden",
  )!.authorId = "maya";
  assert.throws(() => parse(wrongPageAuthor), /invalid or duplicate/);
  const wrongDraftAuthor = customSaved();
  wrongDraftAuthor.drafts["maya:album-garden"] = {
    title: "",
    text: "Not a participant",
  };
  assert.throws(() => parse(wrongDraftAuthor), /invalid or duplicate/);
  const foreignDraft = customSaved();
  foreignDraft.drafts["lily:album-garden"].replyTo = "lily-2";
  assert.throws(() => parse(foreignDraft), /invalid or duplicate/);
  const foreignPage = customSaved();
  foreignPage.pages.find(
    (item) => item.albumId === "album-garden" && item.authorId === "lily",
  )!.replyTo = "lily-2";
  assert.throws(() => parse(foreignPage), /invalid or duplicate/);
});

test("invalid scrapbook metadata rejects the whole snapshot for pages and drafts", () => {
  const valid = design();
  const invalidDesigns: unknown[] = [
    null,
    [],
    { ...valid, layout: "html" },
    { ...valid, tape: "external-url" },
    { ...valid, photoTilt: 13 },
    { ...valid, photoTilt: -13 },
    { ...valid, photoTilt: Number.NaN },
    { ...valid, stickers: null },
    {
      ...valid,
      stickers: Array.from({ length: 25 }, (_, i) => ({
        ...valid.stickers[0],
        id: `s-${i}`,
      })),
    },
    { ...valid, stickers: [valid.stickers[0], { ...valid.stickers[0] }] },
    ...[
      { id: "" },
      { id: "x".repeat(101) },
      { kind: "script" },
      { x: -1 },
      { x: 101 },
      { x: "40" },
      { x: Number.POSITIVE_INFINITY },
      { y: -1 },
      { y: 101 },
      { rotation: -181 },
      { rotation: 181 },
      { scale: 0.59 },
      { scale: 1.61 },
    ].map((patch) => ({
      ...valid,
      stickers: [{ ...valid.stickers[0], ...patch }],
    })),
  ];
  for (const invalidDesign of invalidDesigns) {
    const pageData = saved();
    (pageData.pages[0] as unknown as Record<string, unknown>).design =
      invalidDesign;
    assert.throws(() => parse(pageData), /invalid or duplicate/);
    const draftData = saved();
    (
      draftData.drafts["alex:lily"] as unknown as Record<string, unknown>
    ).design = invalidDesign;
    assert.throws(() => parse(draftData), /invalid or duplicate/);
  }
});

test("malformed JSON or an unsupported root schema is rejected rather than repaired", () => {
  assert.throws(() => parseStoredData("{incomplete"));
  for (const invalid of [
    null,
    [],
    {},
    { ...saved(), version: 2 },
    { ...saved(), drafts: [] },
    { ...saved(), pages: null },
  ]) {
    assert.throws(() => parse(invalid));
  }
});

test("one malformed record rejects the complete snapshot, preserving the original source for recovery", () => {
  for (const mutate of [
    (data: AppData) => {
      data.pages[3].createdAt = "not a date";
    },
    (data: AppData) => {
      data.pages[3].authorId = "maya";
    },
    (data: AppData) => {
      data.checkIns[0].connection = 6;
    },
    (data: AppData) => {
      data.checkIns[0].week = "2026-11-99";
    },
    (data: AppData) => {
      data.checkIns[0].week = "2026-11-10";
    },
    (data: AppData) => {
      data.drafts["alex:lily"].text = "x".repeat(10_001);
    },
    (data: AppData) => {
      data.readReplyIds.push("");
    },
  ]) {
    const data = saved();
    mutate(data);
    const raw = JSON.stringify(data);
    assert.throws(() => parseStoredData(raw), /invalid or duplicate/);
    assert.equal(
      JSON.stringify(data),
      raw,
      "validation does not mutate or replace the source",
    );
  }
});

test("arbitrary external, script, SVG and unapproved local image URLs are rejected", () => {
  for (const photo of [
    "https://tracker.example/photo.jpg",
    "javascript:alert(1)",
    "data:image/svg+xml;base64,PHN2Zz4=",
    "/private/photo.jpg",
    "data:image/jpeg;base64,not valid",
  ]) {
    const pageData = saved();
    pageData.pages[0].photo = photo;
    assert.throws(() => parse(pageData), /invalid or duplicate/, photo);
    const draftData = saved();
    draftData.drafts["alex:lily"].photo = photo;
    assert.throws(() => parse(draftData), /invalid or duplicate/, photo);
  }
});

test("duplicate primary IDs and ambiguous weekly reflections are rejected", () => {
  const duplicatePage = saved();
  duplicatePage.pages.push({ ...duplicatePage.pages[0] });
  assert.throws(() => parse(duplicatePage), /invalid or duplicate/);
  const duplicateCheckIn = saved();
  duplicateCheckIn.checkIns.push({
    ...duplicateCheckIn.checkIns[0],
    week: "2026-11-02",
  });
  assert.throws(() => parse(duplicateCheckIn), /invalid or duplicate/);
  const duplicateWeek = saved();
  duplicateWeek.checkIns.push({
    ...duplicateWeek.checkIns[0],
    id: "different-id",
  });
  assert.throws(() => parse(duplicateWeek), /invalid or duplicate/);
  const duplicateRead = saved();
  duplicateRead.readReplyIds.push("lily-4");
  assert.throws(() => parse(duplicateRead), /invalid or duplicate/);
});

test("draft reply links require an existing, delivered page by the other participant in the same album", () => {
  for (const replyTo of ["missing-parent", "sam-1", "lily-3"]) {
    const data = saved();
    data.drafts["alex:lily"].replyTo = replyTo;
    assert.throws(() => parse(data), /invalid or duplicate/, replyTo);
  }
  const notDelivered = saved();
  notDelivered.pages.find((p) => p.id === "lily-4")!.status = "sent";
  assert.throws(() => parse(notDelivered), /invalid or duplicate/);
  const wrongParticipant = saved();
  wrongParticipant.drafts["maya:lily"] = { title: "", text: "Wrong album" };
  assert.throws(() => parse(wrongParticipant), /invalid or duplicate/);
});

test("published reply links also reject orphan, self-authored and cross-album relationships", () => {
  for (const replyTo of ["missing-parent", "sam-3", "lily-3"]) {
    const data = saved();
    data.pages.find((p) => p.id === "lily-2")!.replyTo = replyTo;
    assert.throws(() => parse(data), /invalid or duplicate/, replyTo);
  }
});
