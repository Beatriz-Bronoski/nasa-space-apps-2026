import test from "node:test";
import assert from "node:assert/strict";
import {
  addContribution,
  advanceDelivery,
  createInitialData,
  formatDate,
  getReplyNotifications,
  getStatusLabel,
  hasCrisisLanguage,
  weekKey,
  type AppData,
  type Contribution,
} from "./model";

const now = new Date("2026-11-14T15:00:00Z");
const empty = (): AppData => ({
  version: 1,
  pages: [],
  drafts: {},
  checkIns: [],
  readReplyIds: [],
});
const page = (extra: Partial<Contribution> = {}): Contribution => ({
  id: "original",
  albumId: "lily",
  authorId: "alex",
  title: "A moment",
  text: "Hello",
  createdAt: now.toISOString(),
  status: "recorded",
  ...extra,
});

test("a recorded page survives an interruption and resumes sending on reconnection", () => {
  const pages = [page()];
  assert.equal(advanceDelivery(pages, false, now), pages);
  const sent = advanceDelivery(pages, true, now);
  assert.equal(sent[0].status, "sent");
  assert.equal(sent[0].sentAt, now.toISOString());
  const interrupted = advanceDelivery(
    sent,
    false,
    new Date(now.getTime() + 60_000),
  );
  assert.equal(interrupted[0].status, "sent");
  const delivered = advanceDelivery(
    interrupted,
    true,
    new Date(now.getTime() + 60_000),
  );
  assert.equal(delivered[0].status, "delivered");
  assert.equal(
    pages[0].status,
    "recorded",
    "the reducer does not mutate its input",
  );
});

test("a page cannot skip the simulated transit delay or receive an invented reply", () => {
  const sent = advanceDelivery([page()], true, now);
  assert.equal(
    advanceDelivery(sent, true, new Date(now.getTime() + 11_999))[0].status,
    "sent",
  );
  const delivered = advanceDelivery(
    sent,
    true,
    new Date(now.getTime() + 12_000),
  );
  assert.equal(delivered[0].status, "delivered");
  assert.equal(
    advanceDelivery(delivered, true, new Date(now.getTime() + 86_400_000))[0]
      .status,
    "delivered",
  );
});

test("a parent is answered only after a real reply is delivered, and the result reaches its author", () => {
  const data = {
    ...empty(),
    pages: [page({ status: "delivered", deliveredAt: now.toISOString() })],
  };
  const withReply = addContribution(
    data,
    {
      albumId: "lily",
      authorId: "lily",
      title: "Back from Earth",
      text: "I saw it too!",
      replyTo: "original",
    },
    now,
  );
  assert.equal(withReply.pages[0].status, "delivered");
  assert.equal(getReplyNotifications(withReply, "alex").length, 0);
  const sent = advanceDelivery(withReply.pages, true, now);
  assert.equal(sent[0].status, "delivered");
  const delivered = advanceDelivery(
    sent,
    true,
    new Date(now.getTime() + 12_000),
  );
  assert.equal(delivered[0].status, "answered");
  assert.equal(
    delivered[0].answeredAt,
    new Date(now.getTime() + 12_000).toISOString(),
  );
  const received = { ...withReply, pages: delivered };
  const notifications = getReplyNotifications(received, "alex");
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].authorId, "lily");
  assert.equal(getReplyNotifications(received, "lily").length, 0);
  assert.equal(
    getReplyNotifications(
      { ...received, readReplyIds: [notifications[0].id] },
      "alex",
    ).length,
    0,
  );
});

test("same-author and cross-album replies cannot mark a page answered", () => {
  const parent = page({ status: "delivered" });
  const invalid = [
    parent,
    page({ id: "self", replyTo: parent.id, status: "delivered" }),
    page({
      id: "cross",
      albumId: "sam",
      authorId: "sam",
      replyTo: parent.id,
      status: "delivered",
    }),
  ];
  assert.equal(advanceDelivery(invalid, true, now)[0].status, "delivered");
  assert.throws(
    () =>
      addContribution(
        { ...empty(), pages: [parent] },
        {
          albumId: "lily",
          authorId: "alex",
          title: "Self",
          text: "Text",
          replyTo: parent.id,
        },
        now,
      ),
    /other participant/,
  );
});

test("new pages are always recorded, validate their album, and sort chronologically", () => {
  const data = {
    ...empty(),
    pages: [page({ createdAt: "2026-11-15T12:00:00Z" })],
  };
  const next = addContribution(
    data,
    {
      albumId: "lily",
      authorId: "alex",
      title: "  Hello  ",
      text: "  From orbit  ",
    },
    now,
  );
  assert.equal(next.pages[0].title, "Hello");
  assert.equal(next.pages[0].text, "From orbit");
  assert.equal(next.pages[0].status, "recorded");
  assert.equal(data.pages.length, 1);
  assert.throws(
    () =>
      addContribution(empty(), {
        albumId: "lily",
        authorId: "maya",
        title: "",
        text: "Hello",
      }),
    /participant/,
  );
  assert.throws(
    () =>
      addContribution(empty(), {
        albumId: "lily",
        authorId: "alex",
        title: "",
        text: "  ",
      }),
    /few words/,
  );
});

test("weekly check-in keys use Monday in UTC, including a year boundary", () => {
  assert.equal(weekKey(new Date("2027-01-01T00:00:00Z")), "2026-12-28");
  assert.equal(weekKey(new Date("2027-01-03T23:59:59Z")), "2026-12-28");
  assert.equal(weekKey(new Date("2027-01-04T00:00:00Z")), "2027-01-04");
  assert.equal(weekKey(new Date("2026-11-15T23:00:00-03:00")), "2026-11-16");
});

test("dates always include day, month and year, in UTC", () => {
  assert.equal(formatDate("2026-11-14T23:30:00-03:00"), "15 November 2026");
  assert.equal(formatDate("invalid"), "Date unavailable");
  assert.equal(getStatusLabel("answered"), "Answered");
});

test("crisis cues surface support in English and Portuguese without treating activity as a score", () => {
  for (const text of [
    "I don't want to be here anymore",
    "I want to die",
    "I’m thinking about suicide",
    "I might hurt myself",
    "I can't keep myself safe",
    "Não quero mais viver",
    "Eu quero me matar",
    "Estou pensando em suicídio",
    "Quero acabar com a minha vida",
  ])
    assert.equal(hasCrisisLanguage(text), true, text);
  for (const text of [
    "Let's kill time with a story",
    "I miss home",
    "I sent no messages this week",
    "The plant is still here.",
  ])
    assert.equal(hasCrisisLanguage(text), false, text);
});

test("the initial albums contain chronological pages, an incoming result, and no fabricated transit state", () => {
  const data = createInitialData(now);
  assert.equal(data.pages.length, 10);
  assert.deepEqual(data.readReplyIds, []);
  assert.equal(getReplyNotifications(data, "alex").length, 1);
  assert.equal(
    data.pages.filter(
      (p) => p.authorId === "alex" && p.status === "delivered" && !p.replyTo,
    ).length,
    2,
  );
  assert.deepEqual(
    data.pages.map((p) => p.createdAt),
    [...data.pages.map((p) => p.createdAt)].sort(),
  );
});
