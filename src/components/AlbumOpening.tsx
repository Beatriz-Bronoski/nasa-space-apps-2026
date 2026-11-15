"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Heart } from "lucide-react";
import type { Album } from "@/lib/model";
import "./album-opening.css";

export type AlbumOpeningOrigin = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type Props = {
  album: Album;
  personName: string;
  origin: AlbumOpeningOrigin;
  onComplete: () => void;
};

function stageGeometry(origin: AlbumOpeningOrigin): CSSProperties {
  const viewport =
    typeof window === "undefined" ? 1280 : document.documentElement.clientWidth;
  const portrait = viewport < 686;
  const caseWidth = Math.min(940, viewport - (viewport <= 520 ? 36 : 96));
  const pageWidth = Math.max(
    220,
    Math.min(440, portrait ? caseWidth - 20 : (caseWidth - 26) / 2),
  );
  const pageHeight = pageWidth * 1.35;
  return {
    "--opening-width": `${pageWidth}px`,
    "--opening-height": `${pageHeight}px`,
    "--opening-from-x": `${origin.left}px`,
    "--opening-from-y": `${origin.top}px`,
    "--opening-scale-x": Math.max(1, origin.width) / pageWidth,
    "--opening-scale-y": Math.max(1, origin.height) / pageHeight,
    "--opening-to-x": `${portrait ? (viewport - pageWidth) / 2 : viewport / 2}px`,
    "--opening-to-y": `${viewport <= 520 ? 56 : 76}px`,
  } as CSSProperties;
}

/** A presentation-only bridge from a shelf cover to the chronological reader. */
export default function AlbumOpening({
  album,
  personName,
  origin,
  onComplete,
}: Props) {
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const completed = useRef(false);
  const skipButton = useRef<HTMLButtonElement>(null);
  const [geometry] = useState(() => stageGeometry(origin));

  const complete = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    callback.current();
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) {
      complete();
      return;
    }
    const previousOverflow = document.body.style.overflow;
    const previousGutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = "stable";
    document.body.style.overflow = "hidden";
    skipButton.current?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        complete();
      }
      if (event.key === "Tab") {
        event.preventDefault();
        skipButton.current?.focus({ preventScroll: true });
      }
    };
    const reducedMotion = () => {
      if (preference.matches) complete();
    };
    // A changed viewport invalidates the captured shelf position: finish safely.
    window.addEventListener("resize", complete);
    window.addEventListener("keydown", key, true);
    preference.addEventListener("change", reducedMotion);
    // Covers CSS animation cancellation, background-tab throttling and slow frames.
    const fallback = window.setTimeout(complete, 2100);
    return () => {
      window.clearTimeout(fallback);
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.scrollbarGutter = previousGutter;
      window.removeEventListener("resize", complete);
      window.removeEventListener("keydown", key, true);
      preference.removeEventListener("change", reducedMotion);
    };
  }, [complete]);

  const photo = album.cover.replace(/\.svg$/, ".jpg");
  return (
    <div
      className={`album-opening opening-${album.accent}`}
      style={geometry}
      role="dialog"
      aria-modal="true"
      aria-label={`Opening ${personName}'s album`}
    >
      <div className="opening-backdrop" aria-hidden="true" />
      <span className="sr-only" role="status" aria-live="polite">
        Opening {personName}’s album.
      </span>
      <div
        className="opening-flight"
        aria-hidden="true"
        onAnimationEnd={(event) => {
          if (
            event.target === event.currentTarget &&
            event.animationName === "album-lift-and-open"
          )
            complete();
        }}
      >
        <div className="opening-page-block" />
        <div className="opening-paper opening-right-paper">
          <span className="opening-paper-caption">{album.title}</span>
          <div className="opening-memory">
            <img src={photo} alt="" draggable={false} />
          </div>
          <div className="opening-paper-lines">
            <i />
            <i />
            <i />
          </div>
          <span className="opening-paper-number">02</span>
        </div>
        <div className="opening-left-paper">
          <span className="opening-paper-caption">{personName}</span>
          <div className="opening-paper-lines">
            <i />
            <i />
            <i />
          </div>
          <span className="opening-keepsake">♡</span>
          <span className="opening-paper-number">01</span>
        </div>
        <div className="opening-hardcover">
          <div className="opening-cover-face opening-cover-front">
            <span className="opening-cover-spine" />
            <div className="opening-cover-photo">
              <img src={photo} alt="" draggable={false} />
            </div>
            <div className="opening-cover-name">
              {personName}
              <Heart />
            </div>
            <span className="opening-cover-dots">· · ·</span>
          </div>
          <div className="opening-cover-face opening-cover-back">
            <span className="opening-cover-inscription">{album.title}</span>
          </div>
        </div>
        <span className="opening-center-shadow" />
      </div>
      <button
        ref={skipButton}
        className="opening-skip"
        type="button"
        onClick={complete}
      >
        Skip animation
      </button>
    </div>
  );
}
