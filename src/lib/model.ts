/** Local demonstration data and transport. No timer ever invents a human reply. */
export type Person = {
  id: string;
  name: string;
  role: string;
  location: string;
  initials: string;
  color: string;
};

export type Album = {
  id: string;
  personId: string;
  title: string;
  subtitle: string;
  cover: string;
  accent: string;
};

export type ContributionStatus = "recorded" | "sent" | "delivered" | "answered";
export type Contribution = {
  id: string;
  albumId: string;
  authorId: string;
  title: string;
  text: string;
  photo?: string;
  createdAt: string;
  status: ContributionStatus;
  sentAt?: string;
  deliveredAt?: string;
  answeredAt?: string;
  replyTo?: string;
};

export type Draft = {
  title: string;
  text: string;
  photo?: string;
  replyTo?: string;
};
export type CheckIn = {
  id: string;
  profileId: string;
  week: string;
  createdAt: string;
  connection: number;
  loneliness: number;
  support: number;
  note: string;
};
export type AppData = {
  version: 1;
  pages: Contribution[];
  drafts: Record<string, Draft>;
  checkIns: CheckIn[];
  readReplyIds: string[];
};

export const PEOPLE: Person[] = [
  {
    id: "alex",
    name: "Alex",
    role: "Astronaut",
    location: "On the way to Mars",
    initials: "AL",
    color: "sage",
  },
  {
    id: "lily",
    name: "Lily",
    role: "Daughter",
    location: "Home on Earth",
    initials: "LI",
    color: "amber",
  },
  {
    id: "sam",
    name: "Sam",
    role: "Partner",
    location: "Home on Earth",
    initials: "SA",
    color: "sage",
  },
  {
    id: "maya",
    name: "Maya",
    role: "Friend",
    location: "Home on Earth",
    initials: "MA",
    color: "terracotta",
  },
  {
    id: "june",
    name: "June",
    role: "Mom & caregiver",
    location: "Home on Earth",
    initials: "JU",
    color: "blue",
  },
];

export const ALBUMS: Album[] = [
  {
    id: "lily",
    personId: "lily",
    title: "Little wonders",
    subtitle: "With Lily · Daughter",
    cover: "/images/lily.jpg",
    accent: "amber",
  },
  {
    id: "sam",
    personId: "sam",
    title: "The everyday, together",
    subtitle: "With Sam · Partner",
    cover: "/images/sam.jpg",
    accent: "sage",
  },
  {
    id: "maya",
    personId: "maya",
    title: "Same sky, different places",
    subtitle: "With Maya · Friend",
    cover: "/images/maya.jpg",
    accent: "terracotta",
  },
  {
    id: "june",
    personId: "june",
    title: "A little closer to home",
    subtitle: "With June · Mom & caregiver",
    cover: "/images/june.jpg",
    accent: "blue",
  },
];

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Dates are expressed in UTC so a page keeps its calendar date in every location. */
export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : dateFormatter.format(date);
}

/** A week is identified by the ISO date of its Monday, in UTC. */
export function weekKey(date: Date): string {
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export function getStatusLabel(status: ContributionStatus): string {
  return {
    recorded: "Recorded",
    sent: "Sent",
    delivered: "Delivered",
    answered: "Answered",
  }[status];
}

function chronological(pages: Contribution[]): Contribution[] {
  return [...pages].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
}

/**
 * Explicitly simulated transport: recorded -> sent -> delivered, with interruptions.
 * Answered requires an actual delivered reply from the other participant.
 * Returning the original array when unchanged avoids unnecessary browser writes.
 */
export function advanceDelivery(
  pages: Contribution[],
  online: boolean,
  now: Date,
  delayMs = 12_000,
): Contribution[] {
  if (!online) return pages;
  const timestamp = now.toISOString();
  let changed = false;
  let next = pages.map((page): Contribution => {
    if (page.status === "recorded") {
      changed = true;
      return { ...page, status: "sent", sentAt: timestamp };
    }
    if (page.status === "sent") {
      if (!page.sentAt) {
        changed = true;
        return { ...page, sentAt: timestamp };
      }
      if (now.getTime() - Date.parse(page.sentAt) >= Math.max(0, delayMs)) {
        changed = true;
        return { ...page, status: "delivered", deliveredAt: timestamp };
      }
    }
    return page;
  });
  const answeredBy = new Map<string, string>();
  for (const reply of next) {
    if (
      !reply.replyTo ||
      (reply.status !== "delivered" && reply.status !== "answered")
    )
      continue;
    const parent = next.find((page) => page.id === reply.replyTo);
    if (
      !parent ||
      parent.albumId !== reply.albumId ||
      parent.authorId === reply.authorId
    )
      continue;
    if (parent.status !== "delivered" && parent.status !== "answered") continue;
    const deliveredAt = reply.deliveredAt ?? timestamp;
    const previous = answeredBy.get(parent.id);
    if (!previous || Date.parse(deliveredAt) < Date.parse(previous))
      answeredBy.set(parent.id, deliveredAt);
  }
  next = next.map((page): Contribution => {
    const answeredAt = answeredBy.get(page.id);
    if (!answeredAt || page.status === "answered") return page;
    changed = true;
    return { ...page, status: "answered", answeredAt };
  });
  return changed ? next : pages;
}

export type NewContribution = Pick<
  Contribution,
  "albumId" | "authorId" | "title" | "text" | "photo" | "replyTo"
>;

export function addContribution(
  data: AppData,
  input: NewContribution,
  now = new Date(),
): AppData {
  const album = ALBUMS.find((item) => item.id === input.albumId);
  if (
    !album ||
    (input.authorId !== "alex" && input.authorId !== album.personId)
  ) {
    throw new Error("This person is not a participant in this album.");
  }
  if (!input.text.trim() && !input.photo)
    throw new Error("Add a few words or a photo to your page.");
  if (input.replyTo) {
    const parent = data.pages.find((page) => page.id === input.replyTo);
    if (
      !parent ||
      parent.albumId !== input.albumId ||
      parent.authorId === input.authorId ||
      (parent.status !== "delivered" && parent.status !== "answered")
    ) {
      throw new Error(
        "A reply must refer to a delivered page from the other participant.",
      );
    }
  }
  const page: Contribution = {
    ...input,
    id:
      globalThis.crypto?.randomUUID?.() ??
      `page-${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    title: input.title.trim() || "A little moment",
    text: input.text.trim(),
    createdAt: now.toISOString(),
    status: "recorded",
  };
  return { ...data, pages: chronological([...data.pages, page]) };
}

/** The result of one's own page is the other person's delivered response. */
export function getReplyNotifications(
  data: AppData,
  profileId: string,
): Contribution[] {
  return chronological(
    data.pages.filter((reply) => {
      if (
        !reply.replyTo ||
        reply.authorId === profileId ||
        data.readReplyIds.includes(reply.id)
      )
        return false;
      if (reply.status !== "delivered" && reply.status !== "answered")
        return false;
      const parent = data.pages.find((page) => page.id === reply.replyTo);
      return parent?.authorId === profileId && parent.albumId === reply.albumId;
    }),
  );
}

/**
 * Conservative phrase matching for a nonblocking support panel, never a diagnosis.
 * It cannot establish intent, reliably understand negation, or replace human support.
 */
export function hasCrisisLanguage(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
  const patterns = [
    /\b(kill|hurt|harm)\s+myself\b/,
    /\b(end|take)\s+my\s+(own\s+)?life\b/,
    /\b(want|wish|ready|planning|plan|going)\s+to\s+die\b/,
    /\bi\s+wish\s+i\s+(was|were)\s+dead\b/,
    /\b(don't|do not|dont)\s+want\s+to\s+(live|be alive|wake up|be here)\b/,
    /\b(can't|cannot|cant)\s+(go on|keep myself safe)\b/,
    /\b(suicidal|suicide|self[- ]harm)\b/,
    /\b(quero|vou|planejo|penso em)\s+(me\s+)?(matar|morrer|suicidar)\b/,
    /\b(acabar|terminar)\s+com\s+(a\s+)?minha\s+vida\b/,
    /\bnao\s+quero\s+(mais\s+)?(viver|estar aqui|acordar)\b/,
    /\b(me\s+(machucar|ferir)|suicidio|suicida|automutilacao)\b/,
  ];
  return patterns.some((pattern) => pattern.test(normalized));
}

export function createInitialData(now = new Date()): AppData {
  const at = (hoursAgo: number) =>
    new Date(now.getTime() - hoursAgo * 3_600_000).toISOString();
  const seed = (
    id: string,
    albumId: string,
    authorId: string,
    hoursAgo: number,
    title: string,
    text: string,
    extra: Partial<Contribution> = {},
  ): Contribution => ({
    id,
    albumId,
    authorId,
    title,
    text,
    createdAt: at(hoursAgo),
    status: "delivered",
    sentAt: at(hoursAgo - 0.05),
    deliveredAt: at(hoursAgo - 0.25),
    ...extra,
  });
  const pages = [
    seed(
      "june-1",
      "june",
      "june",
      240,
      "The kitchen is still yours",
      "The rosemary on the windowsill has grown a little wild. I made your favorite tea and sat in the afternoon light. There will always be a place for you at this table.",
      { photo: "/images/june.jpg" },
    ),
    seed(
      "sam-1",
      "sam",
      "sam",
      216,
      "Saving you the window seat",
      "It rained all morning, so I took our books to the little café. Your chair caught the only patch of sun. I thought you would like that.",
      { status: "answered", answeredAt: at(191.75), photo: "/images/sam.jpg" },
    ),
    seed(
      "lily-1",
      "lily",
      "lily",
      204,
      "A very important pancake",
      "Dad! I made a pancake shaped like Saturn. The rings fell off but Mom says that happens in space sometimes. I saved a picture for you.",
      { status: "answered", answeredAt: at(167.75), photo: "/images/lily.jpg" },
    ),
    seed(
      "sam-2",
      "sam",
      "alex",
      192,
      "A seat beside the stars",
      "I read a chapter during our quiet hour today. The view was a little different, but for a moment it felt like we were sitting together. Keep my place.",
      { replyTo: "sam-1" },
    ),
    seed(
      "lily-2",
      "lily",
      "alex",
      168,
      "Best planet in the solar system",
      "I can almost smell the pancakes from here. Saturn loses bits of its rings too, so yours sounds very accurate. Next time, could you make a tiny moon for me?",
      { replyTo: "lily-1" },
    ),
    seed(
      "maya-1",
      "maya",
      "maya",
      120,
      "The long way home",
      "I took the coastal path after work. Same bend in the trail, same unreasonable wind. I stopped where we used to watch the boats and sent a hello up to your part of the sky.",
      { photo: "/images/maya.jpg" },
    ),
    seed(
      "lily-3",
      "lily",
      "alex",
      72,
      "Our little moon garden",
      "I checked on the little plant we started before launch. A new leaf has opened! I wondered how your windowsill garden is doing. Maybe our plants can be pen pals.",
      { status: "answered", answeredAt: at(5.75) },
    ),
    seed(
      "sam-3",
      "sam",
      "alex",
      48,
      "Something ordinary to keep",
      "The first sip of coffee today reminded me of our slow Saturday mornings. Tell me one ordinary thing from your day, whenever a moment finds you. There is no hurry.",
      { photo: "/images/sam.jpg" },
    ),
    seed(
      "june-2",
      "june",
      "alex",
      36,
      "I brought the recipe",
      "I found your handwritten soup recipe tucked into my notebook. The little note at the bottom says, ‘a little more lemon.’ It made me feel close to home today.",
    ),
    seed(
      "lily-4",
      "lily",
      "lily",
      6,
      "The moon got a friend",
      "Our bean has TWO new leaves! I drew a tiny astronaut next to the pot so it has someone to talk to. Please tell your space plant that mine says hello.",
      { replyTo: "lily-3", photo: "/images/lily.jpg" },
    ),
  ];
  return {
    version: 1,
    pages: chronological(pages),
    drafts: {},
    checkIns: [],
    readReplyIds: [],
  };
}
