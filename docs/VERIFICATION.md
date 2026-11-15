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

Shelf-opening animation was checked in the browser: the selected cover is hidden in place while a matching cover lifts with a matrix3d transform, moves forward, and rotates on its spine. At the opening phase the backdrop is opaque and the hardcover has a nontrivial 3D rotation. Normal completion opens the correct immersive album, restores body scrolling, removes inert/overlay state, and focuses the reader heading. Keyboard activation, Skip animation, Escape, repeated opening, double click (one overlay), mobile portrait opening, night mode, and resize during animation all completed without a stuck overlay. Resize restored overflow and scrollbar-gutter styles. Mobile widths of 390px and 414px showed no horizontal overflow. No browser warnings/errors were observed. TypeScript and the 16 existing semantic/persistence tests passed; these do not constitute automated visual-animation coverage. Reduced-motion paths were reviewed in source, without changing the OS preference during this check.

Immersive-reader revision was checked on desktop and at 390px: opening an album removes the sidebar/navigation, mobile identity, and global footer from the DOM. The workspace begins at x=0 and has no reserved bottom-navigation padding or horizontal overflow. Forward page turning works. Add a page opens the composer with normal navigation; Back to the album removes it again; All albums restores the shelf and navigation. The light sidebar computes to RGB 59/77/96 with cream text RGB 248/238/220, distinct from the unchanged cream body. Cream/sidebar text contrast is 7.55:1 and cream/active-selection contrast is 4.75:1; a separate selection marker and light keyboard focus outline are provided.

Complementary palette revision: browser-computed light background remained RGB 242/231/212. The four book covers match their new ochre/olive/clay/slate tokens, with cream names; calculated cover-name contrast is at least 4.58:1. The chronological reader still opens, its bottom creation action remains unique, and a 390px viewport has no horizontal overflow. Night mode uses RGB 29/43/60 with light page text RGB 240/233/220. No browser warnings/errors were observed during these checks.

The cream/bookshelf refinement was checked in the browser: the body background computes to RGB 242/231/212; the desktop shelf has four columns and the 390px viewport has two columns with no horizontal overflow. Relationship subtitle elements are absent. An album still opens its chronological book and keeps one bottom Add a page action. Night mode applies the darker shelf palette. Core normal-text contrast pairs for the revised cream palette were calculated at 4.81:1 or higher.

Layout refinement was checked in the browser on desktop and at 390 × 844: the global header and visible book heading are removed, the astronaut name remains in the upper-left (including after switching to Lily), exactly one Add a page control follows the reader, and that control opens the editor. Footer Settings retains profile selection, simulated connection controls, and the working night-mode switch. No horizontal overflow was observed at the mobile width.

All delivery tests use the clearly labeled simulator. They do not verify communication between devices, secure accounts, encryption, backups, or real spacecraft transport. The support heuristic has false positives and false negatives. See [DECISIONS.md](DECISIONS.md) for the production work required.

## Scrapbook editor revision

- TypeScript and all 21 model/persistence tests passed. New tests cover legacy snapshots, page/draft design roundtrips, malformed metadata, and independent published designs.
- In the browser, a mouse drag added a sticker from the tray at the drop position, and dragging an existing sticker changed its normalized position. Rotation, resize, tap/click addition, Enter addition, arrow-key movement, and Delete were exercised; deletion restored tray focus.
- A compressed local example photo appeared with navy electrical tape. Postcard selection changed the live composition. After a reload, the title, text, photo, layout, and stickers remained in the draft. Publishing opened the new chronological page with all five saved stickers and its photo/tape. Delivery advanced independently of decoration.
- A 390 × 844 viewport had no horizontal page overflow. The mobile tray remained available above the preview; dragging from it onto the paper added a sticker. The paper expanded to preserve the complete note. This is viewport/pointer verification, not a physical touchscreen test.
- A crisis cue displayed support next to the text field while Publish remained enabled. Removing the cue removed the panel. No browser warnings/errors were observed in these flows.
- Physical-device touch, runtime OS reduced-motion changes, a full assistive-technology audit, and clinical review remain unverified.

## Opening handoff performance revision

- TypeScript and all 25 tests passed. Four new isolated readiness tests cover loading/decoding (including rejection), the image deadline, cancellation and late callbacks, and empty spreads waiting for two paint frames.
- In a desktop browser sample approximately 1.1 seconds after activating a shelf book, the opening overlay was still present with an opaque backdrop, while the real reader already reported ready at its final 880 px width. Focus remained on Skip animation and the application stayed inert. After handoff, the ready reader remained available, focus moved to its heading, inert was removed, and body scrolling was restored.
- Page navigation advanced to the next spread. Repeated opening of different albums, keyboard activation, Escape, and the Skip animation button completed without a stuck overlay. A 390 × 844 viewport also had the reader ready while the opening was still present, with no horizontal overflow. Resizing to 414 px during opening safely revealed the correct ready reader and restored scrolling. No browser warnings/errors were observed.
- These are functional timing samples and source-level checks of the mount handoff, not an FPS benchmark or a promise for every device. CPU throttling, physical touch devices, and runtime OS reduced-motion changes were not exercised.

## Physical scrapbook revision

- TypeScript and all 27 semantic tests passed, including two new readiness tests for fonts loading together with photos, failure, timeout, late resolution, and cancellation.
- In the browser, the new self-hosted wood/paper textures, cloth cover stitching, visible leaf stacks, Polaroid photo frames, washi-taped notes, handwritten text, and fabric sticker weave/stitched hems rendered on existing saved pages. Different layouts and saved tape colors retained their data. Page turning still advanced through the book.
- At about 1.1 seconds during opening, the actual reader reported ready while the opening overlay was still visible and the handwriting fonts reported loaded. The handoff completed without a stuck overlay.
- At 390 × 844, the book switched to one portrait page, with document scrollWidth 375 and innerWidth 390 (the scrollbar gutter accounts for the difference). Both light and night materials were reviewed. Focusing the paper text and pressing Ctrl+End reached scrollTop 136, matching scrollHeight−clientHeight 136, and the complete end of the note was visible.
- The editor retained its draft and both new fabric stickers, and arrow-key positioning changed the selected sticker’s saved coordinates. No browser warnings/errors were observed during these flows.
- Representative flat color pairs were calculated: ink on paper 7.84:1, metadata on paper 4.98:1, ink on note 9.32:1, night ink on note 7.07:1, and wood-scene controls 7.28:1. Photographic texture variation and a full independent accessibility audit remain separate from these token checks. Physical touch, CPU-throttled FPS, and runtime OS reduced-motion testing were not performed.

The pickup geometry was aligned to the deeper cover: a desktop opening targeted y = 107 px while the mounted engine paper began at about 108 px. At 686 px viewport width, both the reader and the flying book used portrait mode, and the decorative left paper stayed hidden. Resizing during that opening completed into the correct album.

## Real-page opening continuity revision

- TypeScript and all 33 tests passed. Six new geometry tests cover exact measured spread/portrait targets, missing/invalid/zero DOM boxes, physical cover padding, responsive fallback centering, and the available-width orientation boundary.
- During desktop opening, the stationary page’s title and story matched the actual second reader page. The turning backface carried the actual first page. After accounting for the case border, a late-animation night-mode sample measured zero horizontal difference and about 0.08 px vertical difference between the stationary and real page; both used the same ink. The reader was already ready.
- The opening backdrop and reader’s fixed wood plane had identical image definitions and 720 px heights in the sampled desktop viewport. This removes the previous different crop caused by sizing the reader texture against the full scrollable document.
- At 390 × 844, the opening displayed the first real page in portrait mode, matching its eventual title; scrollWidth 375 remained below innerWidth 390. Escape and Skip animation completed into the correct album, restored body overflow, removed inert, and focused its heading. Resizing to 414 px during a night-mode opening also completed correctly.
- In an isolated fresh browser origin, the seeded one-page Maya album showed that exact page on the turning backface, kept the stationary right side blank, and finished at Page 1 of 1 with Next disabled. Reader page navigation still worked after the shared-leaf refactor. No browser warnings/errors were observed.
- Empty-album and reduced-motion bypasses were reviewed in source. Physical-device touch, CPU-throttled FPS measurements, and changing OS reduced-motion at runtime were not exercised.

## Reference-style open-album revision

- TypeScript strict checking and all 35 tests passed against the final reader layout, focus handling, turn-state guards, and scrollbar-gutter sizing changes. The geometry suite now covers the larger page proportion, viewport-height budget, and narrow-screen minimum width.
- At 1536 × 1024, the open case measured approximately 1489 × 897 px at x = 16, y = 46; the bottom actions ended at y = 995. The book and creation action fit the viewport. Document scrollWidth was 1521 px, below innerWidth 1536 px.
- At 1280 × 720, the existing longer pancake contribution displayed its complete note after the denser arrangement adjustment. The sewn pair label, uppercase author/location labels, thin handwriting and underlines, Earth photo corners, ruled space notes, in-page Reply, page numbers, and corner navigation rendered over the parchment scene.
- Keyboard navigation advanced through spreads 1–2, 3–4, and 5–6 and returned to 3–4. Focus moved to the newly visible paper after each completed turn. Turn controls remained guarded while the page engine was moving. Reply on Lily's fourth page opened the correct continuation in the composer and preserved the existing draft.
- The Page details disclosure expanded to show Recorded, Sent, Delivered, and Answered dates for the current pages, then collapsed. One Add a page action remained below the book. The composer retained its text and existing two stickers; adding, moving with an arrow key, and deleting a temporary sticker returned focus to the tray.
- Portrait layouts at 390 × 844 and 320 × 844 had no horizontal overflow. At 320 px, the page measured 259 px wide and stayed inside its 281 px case after using the body's available width to account for the scrollbar gutter. The bottom Add a page action and Page details did not overlap. At 390 px, portrait navigation advanced to page 2 and focused its paper.
- Light and night materials were reviewed. During opening samples at 390 px and 1536 px, the real reader reported ready while the presentation was still visible, and both scenes used the same pair label. No application warnings or errors were observed in the local browser console.
- These are local functional and viewport checks, not a full contrast or assistive-technology audit. Physical-device touch, CPU-throttled animation measurements, and runtime OS reduced-motion changes remain untested. Production-build and deployment validation are separate release steps.

## Soft final leaves and book depth

- A fresh `npm ci` applied the bounded dependency correction. Running the test hook again reported it already applied. TypeScript and all 39 tests passed. Four added regressions exercise actual installed pagination for one through seven pages in both orientations, preserve cover behavior and page counts, and check repeatability and rejection of unexpected patch targets.
- Before the correction, the three-page Sam album's last page rendered with `opf-page--hard`. Afterward, the same final page rendered with `opf-page--soft`. A timed forward-turn sample showed a polygon-clipped, rotated paper fold and zero hard page elements. The reverse turn also used soft polygon folds and returned focus to the first paper.
- At 390 × 844, navigation reached the final third page and returned to the second page. The sampled last-page turn used soft folds, and the final page received focus. Document scrollWidth was 375 px, below innerWidth 390 px.
- At 320 × 844, shelf books and the open album had document scrollWidth 305 px. The 259 px paper remained inside the 281 px cover. Layered edges, lower cloth cover, all-around shadows, and bottom controls remained contained. Night mode retained the depth layers and readable paper controls.
- During a night-mode opening, the real reader was ready while the presentation remained visible. Both cases had identical computed ambient, contact, and cast-shadow layers. No local browser warnings or errors were observed.
- These are functional and visual browser checks, not an FPS benchmark, a physical-touch test, or a full accessibility audit. Runtime OS reduced-motion testing remains separate; its existing instant-navigation path is unchanged.
