"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { type Book, FlipBook, Page } from "@openpageflip/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  ChevronDown,
  Cloud,
  Feather,
  Heart,
  Plus,
  Send,
} from "lucide-react";
import {
  PEOPLE,
  formatDate,
  getStatusLabel,
  type Album,
  type Contribution,
} from "@/lib/model";
import "@openpageflip/core/styles.css";
import type { Keepsake } from "@/lib/keepsake";
import "./album-book.css";
import ScrapbookPage from "./ScrapbookPage";

type Props = {
  pages: Contribution[];
  album: Album;
  profileId: string;
  initialPageId?: string;
  onCompose: (replyTo?: string) => void;
  onObjectChange: (id: string, next?: Keepsake) => void;
};

const authorName = (id: string) =>
  PEOPLE.find((person) => person.id === id)?.name ?? "Someone close";
const statusIcon = (page: Contribution) =>
  page.status === "recorded"
    ? Cloud
    : page.status === "sent"
      ? Send
      : page.status === "answered"
        ? Heart
        : CheckCheck;

/** Every contribution is a physical leaf; the fold engine controls only its presentation. */
export default function AlbumBook({
  pages,
  album,
  profileId,
  initialPageId,
  onCompose,
  onObjectChange,
}: Props) {
  const book = useRef<Book>(null);
  const lastJump = useRef("");
  const target = Math.max(
    0,
    pages.findIndex((page) => page.id === initialPageId),
  );
  const [index, setIndex] = useState(target);
  const [portrait, setPortrait] = useState(false);
  const [turning, setTurning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!initialPageId || !pages.length) return;
    const request = `${album.id}:${profileId}:${initialPageId}`;
    if (lastJump.current === request) return;
    const requested = pages.findIndex((page) => page.id === initialPageId);
    if (requested >= 0 && book.current) {
      book.current.turnTo(requested);
      setIndex(book.current.page);
      lastJump.current = request;
    }
  }, [initialPageId, album.id, profileId, target, pages.length]);

  const first = Math.min(index, Math.max(0, pages.length - 1));
  const last = Math.min(first + (portrait ? 0 : 1), pages.length - 1);
  const visible = pages.slice(first, last + 1);

  const turn = (direction: "next" | "previous") => {
    const api = book.current;
    if (!api || turning) return;
    if (direction === "next") {
      if (last >= pages.length - 1) return;
      if (reducedMotion) api.turnNext();
      else void api.flipNext("bottom");
    } else {
      if (first <= 0) return;
      if (reducedMotion) api.turnPrev();
      else void api.flipPrev("bottom");
    }
  };

  const onKey = (event: KeyboardEvent<HTMLElement>) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      (event.target instanceof HTMLElement &&
        /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))
    )
      return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      turn(event.key === "ArrowRight" ? "next" : "previous");
    }
  };

  if (!pages.length)
    return (
      <section className="album-reader book-empty">
        <Feather size={28} />
        <h2>A new chapter.</h2>
        <button className="primary-button" onClick={() => onCompose()}>
          <Plus size={15} />
          Add a page
        </button>
      </section>
    );

  return (
    <section
      className={`album-reader ${portrait ? "book-portrait" : "book-spread"}`}
      aria-label={`${album.title}, chronological book`}
      onKeyDown={onKey}
    >
      <div className={`book-case book-case-${album.accent}`}>
        <div className="book-page-edges" aria-hidden="true" />
        <FlipBook
          key={`${album.id}:${profileId}`}
          ref={book}
          className="album-flipbook"
          width={400}
          height={540}
          size="stretch"
          minWidth={280}
          maxWidth={440}
          layout="auto"
          startPage={first}
          cover={false}
          flipDuration={1000}
          shadows
          shadowOpacity={0.3}
          click={reducedMotion ? "off" : "edges"}
          drag={!reducedMotion}
          swipe={!reducedMotion}
          hover={!reducedMotion}
          swipeDistance={35}
          ignoreDragOn="a, button, input, textarea, select, [data-opf-no-flip]"
          onInit={({ page, orientation }) => {
            setTurning(false);
            setIndex(page);
            setPortrait(orientation === "portrait");
          }}
          onFlip={({ page }) => setIndex(page)}
          onUpdate={({ page, orientation }) => {
            setTurning(false);
            setIndex(page);
            setPortrait(orientation === "portrait");
          }}
          onChangeOrientation={({ orientation }) => {
            setTurning(false);
            setPortrait(orientation === "portrait");
            if (book.current) setIndex(book.current.page);
          }}
          onChangeState={({ state }) =>
            setTurning(state === "flipping" || state === "user_fold")
          }
        >
          {pages.map((page, pageIndex) => {
            const Icon = statusIcon(page);
            const own = page.authorId === profileId;
            return (
              <Page
                className={`album-leaf ${page.photo ? "leaf-with-photo" : "leaf-words"}`}
                key={page.id}
              >
                <article
                  className="book-leaf-inner"
                  aria-label={`Page ${pageIndex + 1}: ${page.title}`}
                >
                  <header className="leaf-header">
                    <span>
                      {own
                        ? "A page from you"
                        : `A page from ${authorName(page.authorId)}`}
                    </span>
                    <Feather size={12} />
                  </header>
                  <div
                    className="leaf-content"
                    data-opf-no-flip=""
                    tabIndex={0}
                    role="region"
                    aria-label={`Read page ${pageIndex + 1} by ${authorName(page.authorId)}`}
                  >
                    <ScrapbookPage
                      title={page.title}
                      text={page.text}
                      photo={page.photo}
                      object3d={page.object3d}
                      visibleInBook={pageIndex >= first && pageIndex <= last}
                      onObjectChange={next => onObjectChange(page.id, next)}
                      design={page.design}
                    />
                  </div>
                  <footer className="leaf-footer">
                    <time dateTime={page.createdAt}>
                      {formatDate(page.createdAt)} · UTC
                    </time>
                    <span className={`leaf-status leaf-status-${page.status}`}>
                      <Icon size={11} />
                      {getStatusLabel(page.status)}
                    </span>
                  </footer>
                  <span className="leaf-page-number" aria-hidden="true">
                    {String(pageIndex + 1).padStart(2, "0")}
                  </span>
                </article>
              </Page>
            );
          })}
        </FlipBook>
        {!portrait && <div className="book-binding" aria-hidden="true" />}
      </div>
      <div className="book-navigation">
        <button
          type="button"
          className="book-turn-button"
          aria-label="Previous page"
          title="Previous page · Left arrow"
          disabled={first <= 0 || turning}
          onClick={() => turn("previous")}
        >
          <ArrowLeft size={18} />
        </button>
        <span className="book-pagination" aria-live="polite" aria-atomic="true">
          {first === last
            ? `Page ${first + 1}`
            : `Pages ${first + 1}–${last + 1}`}
          <span>of {pages.length}</span>
        </span>
        <button
          type="button"
          className="book-turn-button"
          aria-label="Next page"
          title="Next page · Right arrow"
          disabled={last >= pages.length - 1 || turning}
          onClick={() => turn("next")}
        >
          <ArrowRight size={18} />
        </button>
      </div>
      <div className="book-actions">
        {visible
          .filter(
            (page) =>
              page.authorId !== profileId &&
              (page.status === "delivered" || page.status === "answered"),
          )
          .map((page) => (
            <button
              className="book-reply-button"
              key={page.id}
              aria-label={`Reply to ${authorName(page.authorId)}, page ${pages.findIndex((item) => item.id === page.id) + 1}`}
              onClick={() => onCompose(page.id)}
            >
              Reply to {authorName(page.authorId)}
              <ArrowRight size={14} />
            </button>
          ))}
      </div>
      <details className="book-journey">
        <summary>
          Page details
          <ChevronDown size={12} />
        </summary>
        <div className="book-journey-pages">
          {visible.map((page, offset) => (
            <div key={page.id}>
              <strong>
                Page {first + offset + 1} · {authorName(page.authorId)}
              </strong>
              <ol>
                <li>
                  <Cloud size={12} />
                  <span>Recorded</span>
                  <time>{formatDate(page.createdAt)}</time>
                </li>
                {page.sentAt && (
                  <li>
                    <Send size={12} />
                    <span>Sent</span>
                    <time>{formatDate(page.sentAt)}</time>
                  </li>
                )}
                {page.deliveredAt && (
                  <li>
                    <CheckCheck size={12} />
                    <span>Delivered</span>
                    <time>{formatDate(page.deliveredAt)}</time>
                  </li>
                )}
                {page.answeredAt && (
                  <li>
                    <Heart size={12} />
                    <span>Answered</span>
                    <time>{formatDate(page.answeredAt)}</time>
                  </li>
                )}
              </ol>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
