"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bell,
  BookHeart,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Cloud,
  Feather,
  Heart,
  ImagePlus,
  Leaf,
  LockKeyhole,
  Moon,
  Plus,
  Radio,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import {
  ALBUMS,
  PEOPLE,
  addContribution,
  advanceDelivery,
  createInitialData,
  formatDate,
  getReplyNotifications,
  getStatusLabel,
  hasCrisisLanguage,
  weekKey,
  type Album,
  type AppData,
  type Contribution,
  type Draft,
} from "@/lib/model";
import { STORAGE_KEY, compressPhoto, parseStoredData } from "@/lib/storage";

type View = "albums" | "story" | "compose" | "checkin" | "replies";
type Dialog = "connection" | "help" | "about" | "choose" | null;
const emptyDraft: Draft = { title: "", text: "" };
const person = (id: string) => PEOPLE.find((p) => p.id === id)!;
const photoUrl = (album: Album) => album.cover.replace(".svg", ".jpg");

function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? "brand-small" : ""}`}>
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <span />
      </span>
      <span>
        still here<span className="brand-period">.</span>
      </span>
    </span>
  );
}

function Avatar({
  id,
  size = "normal",
}: {
  id: string;
  size?: "normal" | "small";
}) {
  const p = person(id);
  return (
    <span className={`avatar ${p.color} ${size}`} aria-hidden="true">
      {p.initials}
    </span>
  );
}

function Status({ page }: { page: Contribution }) {
  const Icon =
    page.status === "recorded"
      ? Cloud
      : page.status === "sent"
        ? Send
        : page.status === "answered"
          ? Heart
          : CheckCheck;
  return (
    <span className={`status status-${page.status}`}>
      <Icon size={13} />
      {getStatusLabel(page.status)}
    </span>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const focusables = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex="0"]',
        ) ?? [],
      ).filter((e) => !e.hasAttribute("disabled"));
    focusables()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const f = focusables();
        const first = f[0],
          last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Support({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`support-panel ${compact ? "compact" : ""}`}
      role="region"
      aria-label="Immediate support"
    >
      <div className="support-title">
        <Heart size={19} />
        <strong>You don’t have to carry this alone.</strong>
      </div>
      <p>
        If you might hurt yourself or are in immediate danger, contact local
        emergency services or your mission’s medical team now. Don’t wait for a
        reply through this album.
      </p>
      <p>
        Reach out to someone you trust who can stay with you. On a mission, use
        your designated urgent medical channel.
      </p>
      <div className="support-resource">
        <span>On Earth · Brazil</span>
        <a href="tel:+55188?oai_link_source=model_response_hotline">
          CVV · Call 188 <ArrowRight size={14} />
        </a>
        <a
          href="https://www.cvv.org.br/chat/?oai_link_source=model_response_hotline"
          target="_blank"
          rel="noreferrer"
        >
          CVV confidential web chat ↗
        </a>
        <small>
          For other locations, use your local crisis service. CVV is emotional
          support, not an emergency service.
        </small>
      </div>
      <p className="fine-print">
        You can keep writing. This message is private and does not alert anyone.
        Automated prompts can miss distress or misunderstand words.
      </p>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<AppData>(() =>
    createInitialData(new Date("2026-11-14T12:00:00Z")),
  );
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("albums");
  const [selected, setSelected] = useState("lily");
  const [profile, setProfile] = useState("alex");
  const [paused, setPaused] = useState(false);
  const [deviceOnline, setDeviceOnline] = useState(true);
  const [dark, setDark] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [highlight, setHighlight] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastStored = useRef<string | null>(null);
  const album = ALBUMS.find((a) => a.id === selected)!;
  const current = person(profile);
  const online = deviceOnline && !paused;
  const albums =
    profile === "alex" ? ALBUMS : ALBUMS.filter((a) => a.personId === profile);
  const notifications = getReplyNotifications(data, profile);
  const draftKey = `${profile}:${selected}`;
  const draft = data.drafts[draftKey] ?? emptyDraft;
  const visiblePages = data.pages
    .filter(
      (p) =>
        p.albumId === selected &&
        (p.authorId === profile ||
          p.status === "delivered" ||
          p.status === "answered"),
    )
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const weekly = data.checkIns.find(
    (c) => c.profileId === profile && c.week === weekKey(new Date()),
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      lastStored.current = raw;
      if (raw) setData(parseStoredData(raw));
      else setData(createInitialData());
      setDark(localStorage.getItem("still-here:theme") === "night");
    } catch {
      setStorageError(
        "Saved data could not be read. This session is temporary; your original browser data has not been replaced.",
      );
    }
    setDeviceOnline(navigator.onLine);
    setReady(true);
    const connected = () => setDeviceOnline(navigator.onLine);
    const externalChange = (e: StorageEvent) => {
      if (
        (e.key === STORAGE_KEY || e.key === null) &&
        e.newValue !== lastStored.current
      )
        setStorageError(
          "Another tab changed your saved albums. To protect both versions, changes in this tab are temporary. Keep any unsaved words, then reload. Please work in one tab at a time.",
        );
    };
    window.addEventListener("online", connected);
    window.addEventListener("offline", connected);
    window.addEventListener("storage", externalChange);
    return () => {
      window.removeEventListener("online", connected);
      window.removeEventListener("offline", connected);
      window.removeEventListener("storage", externalChange);
    };
  }, []);
  useEffect(() => {
    if (
      !ready ||
      storageError.startsWith("Saved data") ||
      storageError.startsWith("Another tab")
    )
      return;
    try {
      if (localStorage.getItem(STORAGE_KEY) !== lastStored.current) {
        setStorageError(
          "Another tab changed your saved albums. To protect both versions, changes in this tab are temporary. Keep any unsaved words, then reload. Please work in one tab at a time.",
        );
        return;
      }
      const raw = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, raw);
      lastStored.current = raw;
      setStorageError("");
    } catch {
      setStorageError(
        "Browser storage is full or unavailable. Your changes are only in this session. Remove a photo or free browser storage before closing.",
      );
    }
  }, [data, ready, storageError]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "night" : "day";
    if (ready)
      try {
        localStorage.setItem("still-here:theme", dark ? "night" : "day");
      } catch {}
  }, [dark, ready]);
  useEffect(() => {
    if (!ready) return;
    const tick = () =>
      setData((d) => {
        const pages = advanceDelivery(d.pages, online, new Date());
        return pages === d.pages ? d : { ...d, pages };
      });
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [ready, online]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (ready) titleRef.current?.focus();
  }, [view, selected]);
  useEffect(() => {
    if (view === "checkin") {
      setRatings(
        weekly
          ? {
              connection: weekly.connection,
              loneliness: weekly.loneliness,
              support: weekly.support,
            }
          : {},
      );
      setNote(weekly?.note ?? "");
    }
  }, [view, profile, weekly?.id]);
  useEffect(() => {
    if (view === "story" && highlight) {
      const timer = setTimeout(
        () =>
          document
            .getElementById(`page-${highlight}`)
            ?.scrollIntoView({
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "instant"
                : "smooth",
              block: "center",
            }),
        120,
      );
      return () => clearTimeout(timer);
    }
  }, [view, highlight]);

  const navigate = (next: View) => {
    setHighlight("");
    setView(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const updateDraft = (changes: Partial<Draft>) =>
    setData((d) => ({
      ...d,
      drafts: {
        ...d.drafts,
        [draftKey]: { ...(d.drafts[draftKey] ?? emptyDraft), ...changes },
      },
    }));
  const openAlbum = (id: string) => {
    setSelected(id);
    navigate("story");
  };
  const compose = (id = selected, replyTo?: string) => {
    setSelected(id);
    if (replyTo)
      setData((d) => ({
        ...d,
        drafts: {
          ...d.drafts,
          [`${profile}:${id}`]: {
            ...(d.drafts[`${profile}:${id}`] ?? emptyDraft),
            replyTo,
          },
        },
      }));
    setPhotoError("");
    navigate("compose");
    setDialog(null);
  };
  const openReply = (page: Contribution) => {
    setSelected(page.albumId);
    setHighlight(page.id);
    setData((d) => ({
      ...d,
      readReplyIds: [...new Set([...d.readReplyIds, page.id])],
    }));
    setView("story");
  };
  const publish = () => {
    try {
      const next = addContribution(data, {
        albumId: selected,
        authorId: profile,
        ...draft,
      });
      const drafts = { ...next.drafts };
      delete drafts[draftKey];
      setData({ ...next, drafts });
      navigate("story");
      setToast(
        online
          ? "Page recorded. It will travel when the connection is ready."
          : "Page recorded on this device. It will send when you reconnect.",
      );
    } catch (e) {
      setPhotoError(
        e instanceof Error ? e.message : "Your page could not be recorded.",
      );
    }
  };
  const handlePhoto = async (file?: File) => {
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError("");
    const key = draftKey;
    try {
      const photo = await compressPhoto(file);
      setData((d) => ({
        ...d,
        drafts: {
          ...d.drafts,
          [key]: { ...(d.drafts[key] ?? emptyDraft), photo },
        },
      }));
    } catch (e) {
      setPhotoError(
        e instanceof Error ? e.message : "Unable to prepare this photo.",
      );
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const saveCheckin = () => {
    const now = new Date();
    setData((d) => ({
      ...d,
      checkIns: [
        ...d.checkIns.filter(
          (c) => !(c.profileId === profile && c.week === weekKey(now)),
        ),
        {
          id: weekly?.id ?? crypto.randomUUID(),
          profileId: profile,
          week: weekKey(now),
          createdAt: now.toISOString(),
          connection: ratings.connection,
          loneliness: ratings.loneliness,
          support: ratings.support,
          note: note.trim(),
        },
      ],
    }));
    setToast("Your check-in is saved privately on this device.");
  };
  const closeDialog = useCallback(() => setDialog(null), []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <button
          className="brand-button"
          aria-label="Still Here home"
          onClick={() => navigate("albums")}
        >
          <Brand />
        </button>
        <p className="sidebar-tagline">A place for your people.</p>
        <span className="nav-label">YOUR LITTLE CORNER</span>
        <nav aria-label="Main navigation">
          <button
            className={
              ["albums", "story", "compose"].includes(view)
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => navigate("albums")}
          >
            <BookOpen size={19} />
            Our albums<span className="nav-number">{albums.length}</span>
          </button>
          <button
            className={view === "replies" ? "nav-item active" : "nav-item"}
            onClick={() => navigate("replies")}
          >
            <Bell size={19} />
            Replies
            {notifications.length > 0 && (
              <span className="notification-count">{notifications.length}</span>
            )}
          </button>
          <button
            className={view === "checkin" ? "nav-item active" : "nav-item"}
            onClick={() => navigate("checkin")}
          >
            <Leaf size={19} />
            Your check-in
            <LockKeyhole className="nav-lock" size={13} />
          </button>
        </nav>
        <div className="sidebar-note">
          <span className="little-orbit" aria-hidden="true">
            ✧
          </span>
          <p>
            Different skies.
            <br />
            The same little things.
          </p>
          <span>Every page brings you closer.</span>
        </div>
        <div className="sidebar-bottom">
          <button
            className="connection-card"
            onClick={() => setDialog("connection")}
          >
            <span className={`connection-dot ${online ? "" : "paused"}`} />
            <span>
              <strong>
                {online ? "Connection is open" : "Connection is paused"}
              </strong>
              <small>
                {online
                  ? "Stories travel at their own pace"
                  : "Your pages are safe in the queue"}
              </small>
            </span>
            <Settings2 size={14} />
          </button>
          <button className="help-button" onClick={() => setDialog("help")}>
            <CircleHelp size={16} />A little support
            <ArrowRight size={14} />
          </button>
          <span className="sidebar-footer">
            Made for the distance. And the love.
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="desktop-crumb">Your space</span>
            <span className="crumb-slash">/</span>
            <strong>
              {view === "checkin"
                ? "A moment for you"
                : view === "replies"
                  ? "Replies"
                  : view === "albums"
                    ? "Our albums"
                    : person(album.personId).name + "’s album"}
            </strong>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button mobile-help"
              aria-label="A little support"
              onClick={() => setDialog("help")}
            >
              <CircleHelp size={18} />
            </button>
            <button
              className="mission-pill"
              onClick={() => setDialog("connection")}
            >
              <span className="connection-dot" />
              <span>Across the distance</span>
              <ChevronDown size={13} />
            </button>
            <button
              className="icon-button theme-button"
              aria-label={
                dark ? "Switch to light mode" : "Switch to night mode"
              }
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="icon-button notification-button"
              aria-label={`Replies, ${notifications.length} unread`}
              onClick={() => navigate("replies")}
            >
              <Bell size={19} />
              {notifications.length > 0 && <i />}
            </button>
            <button
              className="profile-button"
              aria-label={`Demo profile: ${current.name}. Open settings`}
              onClick={() => setDialog("connection")}
            >
              <Avatar id={profile} />
            </button>
          </div>
        </header>
        <main id="main-content" className={`main-content view-${view}`}>
          {storageError && (
            <div className="storage-warning" role="alert">
              <Cloud size={18} />
              {storageError}
            </div>
          )}
          {view === "albums" && (
            <>
              <section className="welcome">
                <div className="welcome-copy">
                  <div className="eyebrow">
                    <span />
                    LIFE HAPPENS IN THE LITTLE MOMENTS
                  </div>
                  <h1 ref={titleRef} tabIndex={-1}>
                    A little closer,
                    <br />
                    <em>from anywhere.</em>
                  </h1>
                  <p>
                    For the everyday stories you don’t want to miss.
                    <br className="desktop-break" /> One page from you. One page
                    from them. All in your own time.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setDialog("choose")}
                  >
                    <Plus size={17} />
                    Add a page
                    <ArrowRight size={16} />
                  </button>
                </div>
                <div className="welcome-art" aria-hidden="true">
                  <span className="orbit orbit-one" />
                  <span className="orbit orbit-two" />
                  <span className="art-spark spark-one">✦</span>
                  <span className="art-spark spark-two">✧</span>
                  <div className="polaroid back-polaroid">
                    <img src="/images/sam.jpg" alt="" />
                    <span>our favorite kind of quiet</span>
                  </div>
                  <div className="polaroid front-polaroid">
                    <span className="tape" />
                    <img src="/images/lily.jpg" alt="" />
                    <span>the little things, kept close ♡</span>
                  </div>
                  <span className="art-caption">A small piece of home.</span>
                  <svg className="caption-arrow" viewBox="0 0 80 50">
                    <path d="M3 3Q72 0 58 39m0 0-6-11m6 11 10-7" />
                  </svg>
                </div>
              </section>
              <div className="gentle-banner">
                <span className="banner-icon">
                  <Radio size={19} />
                </span>
                <p>
                  <strong>No rush. No missed moments.</strong>
                  <span>
                    Pages may take a while to arrive. The connection is still
                    there.
                  </span>
                </p>
                <button onClick={() => setDialog("about")}>
                  How it works
                  <ArrowRight size={15} />
                </button>
              </div>
              <section
                className="albums-section"
                aria-labelledby="albums-title"
              >
                <div className="section-heading">
                  <div>
                    <span className="eyebrow small">
                      A LITTLE PIECE OF EACH OTHER
                    </span>
                    <h2 id="albums-title">Your people. Your stories.</h2>
                  </div>
                  <span className="section-caption">
                    A growing collection of together.
                  </span>
                </div>
                <div className="album-grid">
                  {albums.map((a) => {
                    const p = person(a.personId);
                    const pages = data.pages.filter(
                      (p) =>
                        p.albumId === a.id &&
                        (p.authorId === profile ||
                          ["delivered", "answered"].includes(p.status)),
                    );
                    const last = pages[pages.length - 1];
                    const unread = notifications.find(
                      (n) => n.albumId === a.id,
                    );
                    const ownDraft = data.drafts[`${profile}:${a.id}`];
                    return (
                      <button
                        className={`album-card ${a.accent}`}
                        key={a.id}
                        onClick={() => openAlbum(a.id)}
                        aria-label={`Open ${p.name}'s album, ${a.title}`}
                      >
                        <div className="album-book">
                          <div className="book-spine" />
                          <div className="album-photo">
                            <img
                              src={photoUrl(a)}
                              alt={
                                a.id === "lily"
                                  ? "A child playing at the beach"
                                  : a.id === "sam"
                                    ? "A quiet lake between mountains"
                                    : a.id === "maya"
                                      ? "Friends walking a mountain trail"
                                      : "Flowers growing in a garden"
                              }
                            />
                            <span className="photo-corner tl" />
                            <span className="photo-corner br" />
                          </div>
                          <span className="book-name">
                            {profile === "alex" ? p.name : "Alex & you"}
                            <Heart size={12} />
                          </span>
                          <span className="book-dots">· · ·</span>
                        </div>
                        <div className="album-info">
                          <h3>{a.title}</h3>
                          <span>
                            {profile === "alex"
                              ? p.role
                              : "With Alex · Astronaut"}
                          </span>
                          <div className="album-meta">
                            {pages.length}{" "}
                            {pages.length === 1 ? "page" : "pages"}
                            <span>·</span>
                            {last
                              ? new Intl.DateTimeFormat("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  timeZone: "UTC",
                                }).format(new Date(last.createdAt))
                              : "A fresh beginning"}
                          </div>
                          <div
                            className={`album-update ${unread ? "has-update" : ""}`}
                          >
                            {unread ? (
                              <>
                                <span className="tiny-dot" />A new page from{" "}
                                {person(unread.authorId).name}
                              </>
                            ) : ownDraft?.text || ownDraft?.photo ? (
                              <>
                                <Feather size={12} />A page in the making
                              </>
                            ) : (
                              <>
                                <BookHeart size={13} />
                                Open your album
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="home-bottom">
                <div className="latest-card">
                  <div className="mini-heading">
                    <span>
                      <Sparkles size={15} />A LITTLE SOMETHING CAME HOME
                    </span>
                    <button onClick={() => navigate("replies")}>
                      View replies
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  {notifications[0] ? (
                    <button
                      className="reply-preview"
                      onClick={() => openReply(notifications[0])}
                    >
                      <Avatar id={notifications[0].authorId} />
                      <div>
                        <h3>
                          {person(notifications[0].authorId).name} added to your
                          story
                        </h3>
                        <p>
                          “{notifications[0].text.slice(0, 104)}
                          {notifications[0].text.length > 104 ? "…" : ""}”
                        </p>
                        <span>{formatDate(notifications[0].createdAt)}</span>
                      </div>
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <div className="quiet-empty">
                      <Feather size={23} />
                      <p>
                        Your next little moment will find its way here.
                        <br />
                        <span>There’s nothing you need to wait for.</span>
                      </p>
                    </div>
                  )}
                </div>
                <div className="checkin-teaser">
                  <span className="teaser-leaf">
                    <Leaf size={25} />
                  </span>
                  <div>
                    <div className="mini-heading">
                      <span>
                        JUST FOR YOU
                        <LockKeyhole size={11} />
                      </span>
                    </div>
                    <h3>A moment to check in.</h3>
                    <p>How are you feeling in the space between?</p>
                    <button onClick={() => navigate("checkin")}>
                      {weekly
                        ? "Revisit your check-in"
                        : "Take your weekly check-in"}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </section>
              <div className="page-signoff">
                <span />
                Far apart. Still part of each other’s days.
                <Heart size={12} />
                <span />
              </div>
            </>
          )}

          {view === "story" && (
            <>
              <button
                className="back-button"
                onClick={() => navigate("albums")}
              >
                <ArrowLeft size={16} />
                All albums
              </button>
              <section className="story-heading">
                <div className="story-cover">
                  <img src={photoUrl(album)} alt="Album cover" />
                </div>
                <div>
                  <span className="eyebrow small">
                    {profile === "alex"
                      ? album.subtitle
                      : "With Alex · Astronaut"}
                  </span>
                  <h1 ref={titleRef} tabIndex={-1}>
                    {album.title}
                  </h1>
                  <p>A shared story, one little moment at a time.</p>
                </div>
                <button className="primary-button" onClick={() => compose()}>
                  <Plus size={16} />
                  Add a page
                </button>
              </section>
              <div className="story-note">
                <Feather size={17} />
                <p>
                  Keep the story going whenever you feel like it. There is no
                  turn timer and no reply deadline.
                </p>
              </div>
              <div className="timeline" aria-label="Album pages, oldest first">
                {visiblePages.map((page, index) => {
                  const author = person(page.authorId);
                  const parent = page.replyTo
                    ? data.pages.find((p) => p.id === page.replyTo)
                    : undefined;
                  const canReply =
                    page.authorId !== profile &&
                    ["delivered", "answered"].includes(page.status);
                  return (
                    <article
                      id={`page-${page.id}`}
                      key={page.id}
                      className={`story-page ${page.authorId === profile ? "own-page" : ""} ${highlight === page.id ? "highlighted" : ""}`}
                    >
                      <div className="timeline-node">
                        <Avatar id={page.authorId} size="small" />
                      </div>
                      <div className="page-top">
                        <span>
                          <strong>
                            {page.authorId === profile ? "You" : author.name}
                          </strong>
                          <span className="page-index">
                            PAGE {String(index + 1).padStart(2, "0")}
                          </span>
                        </span>
                        <time dateTime={page.createdAt}>
                          {formatDate(page.createdAt)} · UTC
                        </time>
                      </div>
                      {parent && (
                        <div className="reply-context">
                          <ArrowDown size={12} />A page in response to “
                          {parent.title}”
                        </div>
                      )}
                      <h2>{page.title}</h2>
                      <p className="page-text">{page.text}</p>
                      {page.photo && (
                        <img
                          className="page-photo"
                          src={page.photo}
                          alt={`Photo accompanying ${page.title}`}
                        />
                      )}
                      <div className="page-bottom">
                        <Status page={page} />
                        {canReply && (
                          <button
                            className="text-button"
                            onClick={() => compose(page.albumId, page.id)}
                          >
                            Write the next page
                            <ArrowRight size={14} />
                          </button>
                        )}
                        {page.authorId === profile &&
                          page.status === "delivered" && (
                            <span className="no-rush">
                              A reply can come in its own time.
                            </span>
                          )}
                      </div>
                      <details className="delivery-details">
                        <summary>
                          Page journey <ChevronDown size={12} />
                        </summary>
                        <ol>
                          <li>
                            <Cloud size={13} />
                            <span>Recorded on this device</span>
                            <time>{formatDate(page.createdAt)}</time>
                          </li>
                          {page.sentAt && (
                            <li>
                              <Send size={13} />
                              <span>Sent through the demo link</span>
                              <time>{formatDate(page.sentAt)}</time>
                            </li>
                          )}
                          {page.deliveredAt && (
                            <li>
                              <CheckCheck size={13} />
                              <span>Delivered to this album</span>
                              <time>{formatDate(page.deliveredAt)}</time>
                            </li>
                          )}
                          {page.answeredAt && (
                            <li>
                              <Heart size={13} />
                              <span>A response was delivered</span>
                              <time>{formatDate(page.answeredAt)}</time>
                            </li>
                          )}
                        </ol>
                        <small>
                          Times recorded in UTC. Delivery does not mean a person
                          has read the page.
                        </small>
                      </details>
                    </article>
                  );
                })}
                <div className="timeline-end">
                  <BookHeart size={22} />
                  <p>There’s always room for another little moment.</p>
                  <button
                    className="secondary-button"
                    onClick={() => compose()}
                  >
                    <Plus size={15} />
                    Add your page
                  </button>
                </div>
              </div>
            </>
          )}

          {view === "compose" && (
            <div className="editor-wrap">
              <button className="back-button" onClick={() => navigate("story")}>
                <ArrowLeft size={16} />
                Back to the album
              </button>
              <div className="editor-heading">
                <span className="eyebrow small">
                  A NEW PAGE · WITH{" "}
                  {profile === "alex"
                    ? person(album.personId).name.toUpperCase()
                    : "ALEX"}
                </span>
                <h1 ref={titleRef} tabIndex={-1}>
                  What would you like to keep?
                </h1>
                <p>
                  A small thing from your day can mean the world to someone.
                </p>
              </div>
              <form
                className="editor-paper"
                onSubmit={(e) => {
                  e.preventDefault();
                  publish();
                }}
              >
                {draft.replyTo && (
                  <div className="replying-to">
                    <Heart size={15} />
                    <span>
                      Continuing “
                      {data.pages.find((p) => p.id === draft.replyTo)?.title ??
                        "your shared story"}
                      ”
                    </span>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Remove reply link"
                      onClick={() => updateDraft({ replyTo: undefined })}
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
                <label className="field-label" htmlFor="page-title">
                  Give this moment a name <span>(optional)</span>
                </label>
                <input
                  id="page-title"
                  className="title-input"
                  placeholder="A little moment worth keeping…"
                  maxLength={120}
                  value={draft.title}
                  onChange={(e) => updateDraft({ title: e.target.value })}
                />
                <label className="sr-only" htmlFor="page-text">
                  Your story
                </label>
                <textarea
                  id="page-text"
                  className="story-input"
                  placeholder="I thought of you today when…"
                  maxLength={10000}
                  value={draft.text}
                  onChange={(e) => updateDraft({ text: e.target.value })}
                />
                {hasCrisisLanguage(draft.text + " " + draft.title) && (
                  <div className="immediate-support" role="alert">
                    <Support compact />
                  </div>
                )}
                {draft.photo ? (
                  <div className="draft-photo">
                    <img src={draft.photo} alt="Your selected photo" />
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => updateDraft({ photo: undefined })}
                    >
                      <Trash2 size={14} />
                      Remove photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="photo-upload"
                    onClick={() => fileRef.current?.click()}
                    disabled={photoBusy}
                  >
                    <ImagePlus size={22} />
                    <span>
                      <strong>
                        {photoBusy
                          ? "Preparing your photo…"
                          : "Add a little window into your day"}
                      </strong>
                      <small>
                        One photo · JPEG, PNG, or WebP · up to 10 MB, made
                        lighter here
                      </small>
                    </span>
                    <Plus size={17} />
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  className="sr-only"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handlePhoto(e.target.files?.[0])}
                />
                {photoError && (
                  <p className="field-error" role="alert">
                    {photoError}
                  </p>
                )}
                <div className="editor-meta">
                  <span>
                    <Avatar id={profile} size="small" />A page from{" "}
                    {current.name}
                  </span>
                  <span>
                    <Check size={13} />
                    {storageError
                      ? "Draft in this session"
                      : ready
                        ? "Draft saved on this device"
                        : "Opening your notebook…"}
                  </span>
                </div>
                <div className="editor-actions">
                  <p>
                    <LockKeyhole size={13} />
                    Only for this shared album.
                    <br />
                    <span>You don’t need to wait for a reply.</span>
                  </p>
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={
                      !ready ||
                      photoBusy ||
                      (!draft.text.trim() && !draft.photo)
                    }
                  >
                    <Send size={16} />
                    Publish page
                  </button>
                </div>
              </form>
              <p className="editor-footnote">
                <Cloud size={15} />
                {online
                  ? "Your page is recorded first, then sent through the demo link."
                  : "Connection paused. Your page will stay recorded until the link returns."}
              </p>
            </div>
          )}

          {view === "replies" && (
            <div className="narrow-content">
              <span className="eyebrow small">
                LITTLE MOMENTS, FINDING THEIR WAY BACK
              </span>
              <h1 ref={titleRef} tabIndex={-1}>
                Something came home.
              </h1>
              <p className="page-intro">
                When someone continues your story, you’ll find their page here.
              </p>
              {data.pages
                .filter(
                  (p) =>
                    p.replyTo &&
                    p.authorId !== profile &&
                    ["delivered", "answered"].includes(p.status) &&
                    data.pages.some(
                      (parent) =>
                        parent.id === p.replyTo && parent.authorId === profile,
                    ),
                )
                .reverse()
                .map((page) => (
                  <button
                    className="inbox-card"
                    key={page.id}
                    onClick={() => openReply(page)}
                  >
                    <Avatar id={page.authorId} />
                    <div>
                      {!data.readReplyIds.includes(page.id) && (
                        <span className="new-label">A NEW PAGE</span>
                      )}
                      <h2>{person(page.authorId).name} continued your story</h2>
                      <p>
                        In response to “
                        {data.pages.find((p) => p.id === page.replyTo)?.title}”
                      </p>
                      <blockquote>{page.text}</blockquote>
                      <span className="inbox-date">
                        {formatDate(page.createdAt)} · Open their page
                      </span>
                    </div>
                    <ArrowRight size={19} />
                  </button>
                ))}
              {!data.pages.some(
                (p) =>
                  p.replyTo &&
                  p.authorId !== profile &&
                  ["delivered", "answered"].includes(p.status) &&
                  data.pages.some(
                    (parent) =>
                      parent.id === p.replyTo && parent.authorId === profile,
                  ),
              ) && (
                <div className="empty-state">
                  <BookHeart size={40} />
                  <h2>A quiet space for now.</h2>
                  <p>
                    Replies will appear when they arrive. You can leave this
                    page and go on with your day.
                  </p>
                  <button
                    className="secondary-button"
                    onClick={() => navigate("albums")}
                  >
                    Back to your albums
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
              <div className="privacy-note">
                <Radio size={17} />
                <p>
                  Replies appear after delivery. There are no typing indicators,
                  read receipts, or expectations of being online together.
                </p>
              </div>
            </div>
          )}

          {view === "checkin" && (
            <div className="checkin-wrap">
              <span className="privacy-badge">
                <LockKeyhole size={12} />
                PRIVATE · JUST FOR {current.name.toUpperCase()}
              </span>
              <h1 ref={titleRef} tabIndex={-1}>
                How is your heart,
                <br />
                <em>this week?</em>
              </h1>
              <p className="page-intro">
                A small pause to notice how you feel.
                <br />
                No right answers. Nothing you have to earn.
              </p>
              <div className="checkin-week">
                <Leaf size={16} />
                Week of {formatDate(weekKey(new Date()) + "T00:00:00Z")}
                <span>
                  {weekly
                    ? "Saved · You can change your answers"
                    : "About a minute, at your own pace"}
                </span>
              </div>
              <form
                className="checkin-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveCheckin();
                }}
              >
                {[
                  {
                    key: "connection",
                    label: "How connected have you felt to your people?",
                    low: "Not connected",
                    high: "Very connected",
                  },
                  {
                    key: "loneliness",
                    label: "How much loneliness have you felt?",
                    low: "Not at all",
                    high: "A great deal",
                  },
                  {
                    key: "support",
                    label: "How supported have you felt?",
                    low: "Not supported",
                    high: "Very supported",
                  },
                ].map((q, i) => (
                  <fieldset className="question" key={q.key}>
                    <legend>
                      <span>0{i + 1}</span>
                      {q.label}
                    </legend>
                    <div className="rating-options">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label
                          className={
                            ratings[q.key] === n
                              ? "rating-option selected"
                              : "rating-option"
                          }
                          key={n}
                        >
                          <input
                            type="radio"
                            name={q.key}
                            value={n}
                            required
                            checked={ratings[q.key] === n}
                            onChange={() =>
                              setRatings({ ...ratings, [q.key]: n })
                            }
                            aria-label={`${n} of 5${n === 1 ? " — " + q.low : n === 5 ? " — " + q.high : ""}`}
                          />
                          <span>{n}</span>
                        </label>
                      ))}
                    </div>
                    <div className="scale-labels">
                      <span>1 · {q.low}</span>
                      <span>5 · {q.high}</span>
                    </div>
                  </fieldset>
                ))}
                <label className="field-label" htmlFor="checkin-note">
                  Anything you’d like to make space for? <span>(optional)</span>
                </label>
                <textarea
                  className="note-input"
                  id="checkin-note"
                  placeholder="A thought, a feeling, a little thing you need…"
                  value={note}
                  maxLength={2000}
                  onChange={(e) => setNote(e.target.value)}
                />
                {hasCrisisLanguage(note) && (
                  <div className="immediate-support" role="alert">
                    <Support compact />
                  </div>
                )}
                <div className="checkin-actions">
                  <span>
                    <ShieldCheck size={17} />
                    For reflection, never a score.
                  </span>
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={
                      !ratings.connection ||
                      !ratings.loneliness ||
                      !ratings.support
                    }
                  >
                    <Check size={16} />
                    {weekly ? "Update my check-in" : "Save my check-in"}
                  </button>
                </div>
                {weekly && (
                  <p className="saved-checkin">
                    <CheckCheck size={15} />
                    Saved {formatDate(weekly.createdAt)}. Your answers are never
                    added to an album.
                  </p>
                )}
              </form>
              <div className="privacy-note">
                <LockKeyhole size={18} />
                <p>
                  This check-in stays in this browser. It isn’t shared,
                  monitored, or used to diagnose you. Demo profiles share this
                  device’s storage; use your own trusted device.
                  <br />
                  <strong>
                    The number of pages you write says nothing about your
                    well-being.
                  </strong>
                </p>
              </div>
              {data.checkIns.filter(
                (c) =>
                  c.profileId === profile && c.week !== weekKey(new Date()),
              ).length > 0 && (
                <details className="past-checkins">
                  <summary>Previous private reflections</summary>
                  {data.checkIns
                    .filter(
                      (c) =>
                        c.profileId === profile &&
                        c.week !== weekKey(new Date()),
                    )
                    .reverse()
                    .map((c) => (
                      <div key={c.id}>
                        <strong>
                          Week of {formatDate(c.week + "T00:00:00Z")}
                        </strong>
                        <p>
                          Connection {c.connection}/5 · Loneliness{" "}
                          {c.loneliness}/5 · Support {c.support}/5
                        </p>
                        {c.note && <p>{c.note}</p>}
                      </div>
                    ))}
                </details>
              )}
            </div>
          )}
        </main>
        <footer className="workspace-footer">
          <Brand small />
          <span>
            A local-first preview · Delivery is simulated · Saved in this
            browser
          </span>
          <button onClick={() => setDialog("help")}>
            Here when you need a little support
            <Heart size={12} />
          </button>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={17} />
          </span>
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {dialog === "choose" && (
        <Modal title="Who is this little moment for?" onClose={closeDialog}>
          <p className="modal-intro">
            Pick an album. You can take your time with the words.
          </p>
          <div className="album-choices">
            {albums.map((a) => (
              <button key={a.id} onClick={() => compose(a.id)}>
                <img src={photoUrl(a)} alt="" />
                <span>
                  <strong>
                    {profile === "alex" ? person(a.personId).name : "Alex"}
                  </strong>
                  <small>{a.title}</small>
                </span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {dialog === "connection" && (
        <Modal title="The space between us." onClose={closeDialog}>
          <p className="modal-intro">
            This is an interactive preview. Pages and check-ins stay on this
            device; no real messages are sent.
          </p>
          <div className="link-setting">
            <span className="setting-icon">
              {online ? <Wifi size={23} /> : <WifiOff size={23} />}
            </span>
            <div>
              <strong>
                {online ? "The demo link is open" : "The demo link is paused"}
              </strong>
              <p>
                Delivery takes at least 12 seconds after sending. Pauses hold
                all updates until the link returns.
              </p>
            </div>
            <button
              className={`switch ${!paused ? "on" : ""}`}
              role="switch"
              aria-checked={!paused}
              aria-label="Simulated communication link"
              onClick={() => setPaused(!paused)}
            >
              <span />
            </button>
          </div>
          {!deviceOnline && (
            <p className="field-error">
              Your device is offline. Pages remain queued until it reconnects.
            </p>
          )}
          <label className="field-label" htmlFor="profile-select">
            Explore another side of the story
          </label>
          <select
            id="profile-select"
            className="profile-select"
            value={profile}
            onChange={(e) => {
              setProfile(e.target.value);
              if (e.target.value !== "alex") setSelected(e.target.value);
              navigate("albums");
              setDialog(null);
            }}
          >
            {PEOPLE.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.role}
              </option>
            ))}
          </select>
          <p className="fine-print">
            Demo profiles let you write a reply from someone else’s perspective.
            They are not secure accounts. To test a full exchange: publish as
            Alex, wait for delivery, switch to the other person and write the
            next page, then return to Alex.
          </p>
          <div className="privacy-note">
            <ShieldCheck size={17} />
            <p>
              A real mission needs authenticated accounts, encrypted storage,
              and a verified delivery service. This preview does not provide
              those yet.
            </p>
          </div>
        </Modal>
      )}
      {dialog === "about" && (
        <Modal title="Good stories take their time." onClose={closeDialog}>
          <p className="modal-intro">
            A shared album you can add to from different places, at different
            times. There is no right pace to stay close.
          </p>
          <ol className="how-it-works">
            <li>
              <Cloud size={21} />
              <div>
                <strong>Recorded</strong>
                <p>
                  Your page is kept on this device, even during an interruption.
                </p>
              </div>
            </li>
            <li>
              <Send size={21} />
              <div>
                <strong>Sent</strong>
                <p>
                  The demo link has picked up your page. It may still be
                  travelling.
                </p>
              </div>
            </li>
            <li>
              <CheckCheck size={21} />
              <div>
                <strong>Delivered</strong>
                <p>
                  The page has reached the shared demo album. This is not a read
                  receipt.
                </p>
              </div>
            </li>
            <li>
              <Heart size={21} />
              <div>
                <strong>Answered</strong>
                <p>
                  The other person has added and delivered a page in response.
                  Their words come back to you in Replies.
                </p>
              </div>
            </li>
          </ol>
          <p className="fine-print">
            This preview uses a simulated link. It never invents a human reply.
            In a real mission, delay and interruptions may be much longer.
          </p>
        </Modal>
      )}
      {dialog === "help" && (
        <Modal
          title="A little support, whenever you need it."
          onClose={closeDialog}
        >
          <Support />
          <div className="quiet-support">
            <Leaf size={20} />
            <div>
              <strong>For the everyday space between</strong>
              <p>
                You can pause, leave a draft, or tell someone you’d like some
                company. If things feel hard, your designated care team can help
                you find support.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
