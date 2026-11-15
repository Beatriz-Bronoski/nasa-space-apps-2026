# Verification record

Initial prototype and book-reader revision reviewed November 14, 2026 (America/Sao_Paulo). This is a functional prototype review, not clinical validation or a full accessibility audit. The sections below separate the initial results, completed reader checks, and remaining limits.

## Initial prototype: automated results

- TypeScript strict checking passes.
- 16 semantic tests pass: interrupted transport, reconnection, delivery deadline, valid manual replies and notifications, UTC dates and weeks, support cues, complete persistence roundtrips, malformed records, duplicate IDs, and unsafe image URLs.
- Next.js production static export completes successfully.

## Initial prototype: browser results

- Open an album and verify pages appear oldest first with full calendar dates and their delivery states.
- Write a draft, reload, reopen the editor, and recover the same title and words.
- Enter a synthetic crisis cue: immediate support appears and publishing remains available. Replace the cue before continuing the test.
- Pause the link, publish, and observe Recorded. Resume, allow the simulated deadline to elapse, and see Delivered from the other participant's perspective.
- Write and deliver a real demo-profile reply; the original becomes Answered and its author receives the reply in the inbox. Opening it clears its unread indicator.
- Save the three check-in answers and optional note; revisit and see the same selected answers. No check-in content appears in the shared album.
- Attach a 720px JPEG: canvas produces a JPEG payload of approximately 84 KB. Remove it and verify the upload control returns.
- Test mobile at 390 × 844: album/story/check-in navigation fits, help remains reachable, and the page has no horizontal overflow. Review the navy night palette.
- In a modal, Shift+Tab wraps from the close button to the last control; Escape closes it and focus returns to the opener.
- Edit from a second browser tab: the first tab shows a recovery notice and pauses writes, preserving the newer saved data.
- No application warnings or errors were observed in the browser console during these flows.

## Book-reader revision: completed browser checks

- TypeScript strict checking, all 16 semantic model/persistence tests, and the production static export passed against the revised source and page-turn dependencies.
- Desktop navigation advanced through spreads 1–2, 3–4, and 5–6. Previous-page navigation and arrow-key navigation returned through the book correctly.
- Opening an incoming reply selected its correct contribution on spread 3–4.
- A one-page album disabled both navigation directions. In a three-page album, next-page navigation reached page 3 of 3 and disabled the forward control.
- At a 390 × 844 viewport, the reader displayed one portrait page at a time without horizontal overflow. This was browser viewport testing, not a test on a physical touchscreen.
- Dragging the lower-right page corner across the spine advanced the page. A partial drag returned the sheet to its original position.
- Resizing the viewport during a turn initially left the navigation buttons locked. The turning-state reset was added for initialization, content updates, and orientation changes; the recovery behavior was retested successfully.
- Publishing a new, long contribution opened its exact new page (page 2 of 2 in the test album) and stayed there after the delivery-status update. The contribution retained approximately 4,800 characters. Focusing its native text region and pressing Ctrl+End reached scrollTop 2,020 with clientHeight 308 and scrollHeight 2,328, confirming access to the end of the text. Scrolling occurs inside the paper, not a separate full-text modal.

## Book-reader revision: pending checks and limits

- The reduced-motion media query, effect, and engine instant-navigation path were reviewed in source. Changing the OS preference at runtime was not exercised.
- Touch gestures on a physical mobile device were not tested. Pointer dragging and a mobile browser viewport are not substitutes for that check.
- A full assistive-technology, contrast, and clinical review remains outside this functional browser verification.

## Contrast and motion

In the initial prototype, core text pairs were checked against WCAG AA's 4.5:1 normal-text threshold, including muted copy on cream, sage surfaces, amber support panels, and navy mode. Borders, photographs, and decorative orbit lines are not text. CSS and reader logic implement reduced-motion behavior; the revision's runtime OS preference was not exercised. These checks do not substitute for an independent assistive-technology or full WCAG audit. [W3C contrast requirement](https://www.w3.org/WAI/WCAG20/Understanding/contrast-minimum.html).

## Remaining operational boundary

Complementary palette revision: browser-computed light background remained RGB 242/231/212. The four book covers match their new ochre/olive/clay/slate tokens, with cream names; calculated cover-name contrast is at least 4.58:1. The chronological reader still opens, its bottom creation action remains unique, and a 390px viewport has no horizontal overflow. Night mode uses RGB 29/43/60 with light page text RGB 240/233/220. No browser warnings/errors were observed during these checks.

The cream/bookshelf refinement was checked in the browser: the body background computes to RGB 242/231/212; the desktop shelf has four columns and the 390px viewport has two columns with no horizontal overflow. Relationship subtitle elements are absent. An album still opens its chronological book and keeps one bottom Add a page action. Night mode applies the darker shelf palette. Core normal-text contrast pairs for the revised cream palette were calculated at 4.81:1 or higher.

Layout refinement was checked in the browser on desktop and at 390 × 844: the global header and visible book heading are removed, the astronaut name remains in the upper-left (including after switching to Lily), exactly one Add a page control follows the reader, and that control opens the editor. Footer Settings retains profile selection, simulated connection controls, and the working night-mode switch. No horizontal overflow was observed at the mobile width.

All delivery tests use the clearly labeled simulator. They do not verify communication between devices, secure accounts, encryption, backups, or real spacecraft transport. The support heuristic has false positives and false negatives. See [DECISIONS.md](DECISIONS.md) for the production work required.
