# Still Here

A quiet place for an astronaut and the people they love to keep sharing ordinary moments when a reply takes time.

Still Here is a **local-first MVP and clearly labeled DEMO**. Its shared albums, people, example memories, connection state, and delivery are a simulation in one browser. It has no authentication, backend, or real sharing between devices. The original repository is [guiabbehusen/nasa-space-apps-2026](https://github.com/guiabbehusen/nasa-space-apps-2026).

## Run locally

The app uses Next.js **16.4.6**, TypeScript, React **19**, and Tailwind CSS **4**. Install Node.js and npm compatible with the pinned dependencies, then run these commands from the repository directory:

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). No API key or environment file is required.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

`build` creates the static site in `out/`; `preview` serves that export on port 3000. Stop the development server before previewing on the same port. Use the static preview for a production-build check: this project exports static files and does not use `next start`.

## Explore the demo

Outside the reader, the astronaut's name appears in the upper-left corner and a slate-blue navigation bar separates navigation from the cream canvas. The shelf albums have woven covers, stitched spines, and taped photo labels. Opening one fills the workspace with a physical scrapbook against a warm parchment surface: aged paper, worn edges, a shaded gutter, and visible stacked pages above a cloth cover. A sewn name label identifies the pair. Uppercase author/location labels, light handwritten titles with pencil underlines, printed photo frames, washi tape, and fabric stickers echo the supplied reference. Earth pages use photo corners and notes written directly on the paper; the astronaut's pages use taped photos and torn ruled-paper notes. Existing words, photos, and saved decorations remain intact. Night mode preserves textured blue surfaces and light ink. Use **Shelf** to restore the main navigation.

Choosing a book on the shelf lifts it forward and opens its hardcover over about 1.9 seconds. The opening shows the actual first spread, using the same page renderer and sewn label as the reader. The prepared reader supplies its measured paper/cover bounds, the cover settles fully flat, and a brief 160 ms handoff blends matching pages. Both scenes use one viewport-sized parchment texture plane, so its scale and position stay consistent. The reader still waits for its first layout, photos, and handwriting fonts. **Skip animation** or Escape bypasses the cover motion while preparing the reader. Reduced-motion preference and empty albums go directly to the reading view; a viewport resize safely skips the remaining motion. Direct reply links still open their target page without a shelf animation. These presentation steps do not change delivery or response state.

Use **Add a page** at the bottom of the home or book view. From a book, this opens the composer with the normal navigation restored. **Settings** and **Support** are available in the footer on the other screens; Settings contains the demo profile, connection, and night-mode controls.

1. Open a person's album as a book. The surrounding navigation disappears, leaving **Shelf**, the book, and one bottom **Add a page** action. Each contribution occupies a page in chronological order, with a complete date and delivery state. Use the arrows inside the lower page corners, arrow keys, or a corner drag to turn pages; **Reply** appears within an eligible page. Keyboard navigation moves focus to the newly visible paper. The wide book scales to the available width and height; narrow screens show one page at a time. Reduced-motion mode is implemented to navigate without the page-turn animation. Longer contributions remain inside a focusable region with native scrolling on the paper page; there is no separate full-text modal.
2. Choose **Reply** or **Add a page** to open the scrapbook editor. Write a moment, attach a Polaroid-style photo held by washi tape, and choose Classic, Postcard, or Letter. Drag a sticker from the tray onto the paper, or tap it to add; select it to move, rotate, resize, or remove it. Arrow keys move a focused sticker, Shift moves in larger steps, and Delete removes it. Across/Down sliders provide another way to position stickers. On narrow screens the sticker tray stays above the preview while scrolling. Up to 24 decorations, the layout, tape, photo angle, and writing are saved in the draft and published with the page.
3. Use connection settings to pause simulated delivery. A recorded page stays in this browser until the simulator can advance it. Resume to see **Recorded → Sent → Delivered**. Delivery uses a 12-second simulated deadline; an offline or paused simulator makes no transitions. If the deadline passes during a pause, pending delivery can complete on reconnection. This is not a real network guarantee or a promised arrival time.
4. In connection settings, switch from Alex to Lily, Sam, Maya, or June. Open the relevant book and manually reply to a delivered page. Switch back after that reply is delivered to see its notification and the original page marked **Answered**. Opening a reply takes you to that contribution in the book. A timer never writes a human reply.
5. Open the weekly check-in. Connection, loneliness, and support are separate labeled 1–5 responses. The current week's check-in can be edited; there is no composite health score, diagnosis, or automatic third-party alert.

The interface keeps explanatory copy brief. Response-time reassurance lives in **How it works**, reached from a discreet footer link outside the immersive reader. Delivery states remain in the book; demo limitations, privacy information, and support remain on the other screens. There are no typing indicators, recipient read receipts, streaks, rankings, or measures that treat message quantity as relationship health. The local notification state only tracks which reply notifications have been opened in this demo.

## Local data and photos

Versioned `localStorage` stores pages, drafts, check-ins, and reply-notification state. Use one editing tab at a time: if another tab changes saved data, writes pause in the stale tab and a recovery notice preserves the original saved version. Invalid saved snapshots are left untouched. Drafts are separated by profile and album; check-ins belong to a profile. **Profile switching is a demonstration control, not authentication, security isolation, or encryption. Anyone using this browser can inspect all stored data.** Clearing site data removes the demo's saved content, and no server backup exists. Use fictional content when evaluating it on a shared device.

The photo editor accepts JPEG, PNG, and WebP files up to 10 MB. It uses canvas to produce a JPEG with a longest edge of at most 1,280 pixels and a target size of roughly 350 KB, without copying original EXIF metadata. A photo can be removed before recording the page. Storage overhead and browser quota still apply; the compressed result is stored locally.

## Support behavior

**Support** is available from the footer outside the immersive reader; use **Shelf** to return from a book. Limited English and Portuguese phrase matching also surfaces a nonblocking support panel while typing in the editor or a check-in note. It can miss a crisis or match unrelated text; it does not diagnose risk, monitor anyone, send an alert, or replace human help. Urgent support must use local emergency services or the mission medical team without waiting for an album response. The Brazil resource included in this demo is CVV: [188](tel:+55188?oai_link_source=model_response_hotline), [https://www.cvv.org.br/](https://www.cvv.org.br/?oai_link_source=model_response_hotline). Resources need localization and clinical review before use beyond the demo.

## Verification guide

`npm test` runs semantic model and transport tests with `node:test` through `tsx`. It checks interruption and reconnection, the delivery deadline, manual-reply requirements, reply notifications, author/album validation, UTC dates and week boundaries, and support-language cues. Run the commands above to validate your checkout; this guide is not a record of checks performed.

For a manual review, follow the album/reply flow above, reload with a saved draft and a check-in, remove an attached photo, and exercise the paused/offline controls. For the book, check first/last boundaries, odd and even page counts, forward/backward turns, a newly added contribution, and opening a reply directly. Check corner dragging, arrow-key navigation, the focusable text region's native scroll, and the **Page details** disclosure. Repeat with keyboard only: verify visible focus, dialog dismissal and return focus, form labels, and access to help. Check a narrow mobile viewport for portrait book pages, editor controls, long messages, and dialogs without horizontal overflow. Verify that support appears while entering a cue and that the editor remains usable. Real-device touch and runtime OS reduced-motion preference testing remain separate checks. See [VERIFICATION.md](docs/VERIFICATION.md) for completed results and remaining limits.

## Files and deployment

- `src/app/page.tsx`: interactive application and local browser state.
- `src/app/globals.css`: responsive visual styles and focus states.
- `src/app/layout.tsx`: metadata, document language, and self-hosted fonts.
- `src/components/AlbumBook.tsx`: chronological book reader, page-turn interaction, and accessible navigation.
- `src/components/AlbumLeaf.tsx`: shared real contribution page used in the reader and opening.
- `src/components/AlbumNameplate.tsx`: shared sewn pair-name label for the open book and its opening animation.
- `src/lib/opening-geometry.ts`: measured and initial responsive geometry for the shelf transition.
- `src/components/album-book.css`: paper, binding, page shadows, and responsive reader styles.
- `src/components/ScrapbookEditor.tsx`: pointer and keyboard composition controls.
- `src/components/ScrapbookPage.tsx` and `StickerArt.tsx`: shared page rendering and ten original SVG stickers.
- `src/lib/scrapbook.ts`: bounded, validated decoration metadata.
- `src/components/AlbumOpening.tsx` and `src/components/album-opening.css`: shelf-to-reader lift, forward motion, hardcover opening, and accessible skip/cleanup behavior.
- `src/lib/model.ts`: domain types, sample data, delivery reducer, notifications, and check-in/date helpers.
- `src/lib/model.test.ts` and `src/lib/storage.test.ts`: model, transport, and persistence behavior tests.
- `next.config.ts`: static export configuration.
- `.openai/hosting.json`: Sites project binding and the `out` static directory.
- [Research sources](docs/SOURCES.md), [product and technical decisions](docs/DECISIONS.md), and [image credits](docs/ASSETS.md).

Build before deploying through Sites. The review deployment remains private; access is controlled by Sites settings. `.openai/hosting.json` binds this checkout to the hosting project and identifies `out/` as the static directory. GitHub holds the application source on `main`; Sites serves the built application. Source pushes and private deployment are separate release steps.

A production service needs authenticated backend storage, authorization/RBAC, encryption, a delay-tolerant transport with idempotency and acknowledgments, and review of consent, accessibility, clinical behavior, and localized support resources. See [DECISIONS.md](docs/DECISIONS.md) for the boundary between the demonstration and that work.
