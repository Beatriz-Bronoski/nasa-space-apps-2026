# Still Here

A quiet place for an astronaut and the people they love to keep sharing ordinary moments when a reply takes time.

The home screen is a **local-first DEMO**. Its people, example memories, connection state and delivery are simulated in one browser. **Álbuns compartilhados** opens a separate space with real accounts and invitation-only albums backed by the team's server. Publishing there synchronizes the page with other album members. The demo check-ins and drafts stay on the device. The original repository is [guiabbehusen/nasa-space-apps-2026](https://github.com/guiabbehusen/nasa-space-apps-2026).

## Reviewing photo-to-object on Image_to_object_feature

1. In the demo, choose an album and **Add a page**. Attach a JPEG or PNG using the existing photo picker. The usual photo-only publication still works.
2. Click the photo on the paper and choose **Manter foto** or **Sim, transformar**. COCO-SSD loads about 18 MB of weights from the site; cats and dogs receive an additional local MobileNet check (5.4 MB). Supported subjects are cats, dogs, birds, teddy bears, cars, airplanes, bottles and cups. A centered subject with a clear background works best. The original photo remains available when recognition is inconclusive.
3. Watch the photo fold into a faceted cartoon miniature on the page. It rests at the photo's spot under a fixed overhead camera. Hover over the miniature for a rotation cue, then press and drag it horizontally or vertically. Click or tap the miniature once to rate it, generate a variation, reset its orientation, or restore the photo. Keyboard users can focus the miniature, rotate with the arrow keys, reset with Home and open the review with Enter. This also works on published pages. A reduced-motion preference skips the transition.
4. Open **Álbuns compartilhados** → **Criar uma conta**. Create an album and give the single-use invitation code to a second account. In another browser profile or device, open the same server, create or sign in to that account, and select **Entrar por convite**. Leave the album open. A new page appears automatically, usually within three seconds in a foreground tab. Both members can manipulate the object independently. Only publishing sends the photo and mesh parameters to the album server.

The review specification is in [IMAGE_TO_OBJECT_SPEC.md](docs/IMAGE_TO_OBJECT_SPEC.md). A public photo for trying the local dog detector is available in [PyTorch Hub's example images](https://github.com/pytorch/hub/blob/master/images/dog.jpg).

## Run locally

The app uses Next.js **16.4.6**, TypeScript, React **19**, Tailwind CSS **4**, and the built-in Node SQLite module. Use Node.js 22.18 or later (Node 24 recommended) and npm, then run these commands from the repository directory:

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

`build` creates the static frontend in `out/`. Both `dev` and `preview` expose the same-origin account and album API. Stop the development server before previewing on the same port. The server defaults to loopback and stores data in `.data/still-here.sqlite` outside the public directory. Override with `STILL_HERE_DB`, `STILL_HERE_HOST` and `PORT`. For two phones or computers, use a common server address. For example, on a trusted LAN bind `STILL_HERE_HOST=0.0.0.0` and open the server computer’s LAN address on both devices. For remote use, host the Node process behind HTTPS, set `STILL_HERE_HTTPS=1` for secure cookies and use a persistent database volume. A static-only Sites deployment supports the local demo and local 3D, while real accounts require the Node API.

## Explore the demo

Outside the reader, the astronaut's name appears in the upper-left corner and a slate-blue navigation bar separates navigation from the cream canvas. Opening an album enters an immersive book view without the sidebar, mobile navigation, astronaut label, or global footer. Use **All albums** to leave the book and restore the main navigation.

Choosing a book on the shelf starts a presentation-only transition of about 1.78 seconds: the selected book lifts from its position, moves forward, and opens its hardcover at the spine before revealing the reader. **Skip animation** or Escape opens the reader immediately. Reduced-motion preference bypasses the transition; a viewport resize safely finishes it. Direct reply links still open their target page without a shelf animation. None of these presentation steps changes page delivery or response state.

Use **Add a page** at the bottom of the home or book view. From a book, this opens the composer with the normal navigation restored. **Settings** and **Support** are available in the footer on the other screens; Settings contains the demo profile, connection, and night-mode controls.

1. Open a person's album as a book. The surrounding navigation disappears, leaving the book, its controls, the bottom creation action, and **All albums** to return. Each contribution occupies a page in chronological order. Turn pages forward or backward with the navigation controls, arrow keys, or a corner drag; narrow screens show one page at a time. Reduced-motion mode is implemented to navigate without the page-turn animation. Longer contributions remain inside a focusable region with native scrolling on the paper page; there is no separate full-text modal.
2. Choose **Reply** or **Add a page** to open the scrapbook editor. Write a moment, attach a photo held by electrical tape, and choose Classic, Postcard, or Letter. Drag a sticker from the tray onto the paper, or tap it to add; select it to move, rotate, resize, or remove it. Arrow keys move a focused sticker, Shift moves in larger steps, and Delete removes it. Across/Down sliders provide another way to position stickers. On narrow screens the sticker tray stays above the preview while scrolling. Up to 24 decorations, the layout, tape, photo angle, and writing are saved in the draft and published with the page.
3. Use connection settings to pause simulated delivery. A recorded page stays in this browser until the simulator can advance it. Resume to see **Recorded → Sent → Delivered**. Delivery uses a 12-second simulated deadline; an offline or paused simulator makes no transitions. If the deadline passes during a pause, pending delivery can complete on reconnection. This is not a real network guarantee or a promised arrival time.
4. In connection settings, switch from Alex to Lily, Sam, Maya, or June. Open the relevant book and manually reply to a delivered page. Switch back after that reply is delivered to see its notification and the original page marked **Answered**. Opening a reply takes you to that contribution in the book. A timer never writes a human reply.
5. Open the weekly check-in. Connection, loneliness, and support are separate labeled 1–5 responses. The current week's check-in can be edited; there is no composite health score, diagnosis, or automatic third-party alert.

The interface keeps explanatory copy brief. Response-time reassurance lives in **How it works**, reached from a discreet footer link outside the immersive reader. Delivery states remain in the book; demo limitations, privacy information, and support remain on the other screens. There are no typing indicators, recipient read receipts, streaks, rankings, or measures that treat message quantity as relationship health. The local notification state only tracks which reply notifications have been opened in this demo.

## Local data and photos

Versioned `localStorage` stores pages, drafts, check-ins, and reply-notification state. Use one editing tab at a time: if another tab changes saved data, writes pause in the stale tab and a recovery notice preserves the original saved version. Invalid saved snapshots are left untouched. Drafts are separated by profile and album; check-ins belong to a profile. **Profile switching is a demonstration control, not authentication, security isolation, or encryption. Anyone using this browser can inspect all stored data.** Clearing site data removes the demo's saved content, and no server backup exists. Use fictional content when evaluating it on a shared device.

The photo editor accepts JPEG, PNG, and WebP files up to 10 MB. It uses canvas to produce a JPEG with a longest edge of at most 1,280 pixels and a target size of roughly 350 KB, without copying original EXIF metadata. A photo can be removed before recording the page. Storage overhead and browser quota still apply; the compressed result is stored locally.

## Support behavior

**Support** is available from the footer outside the immersive reader; use **All albums** to return from a book. Limited English and Portuguese phrase matching also surfaces a nonblocking support panel while typing in the editor or a check-in note. It can miss a crisis or match unrelated text; it does not diagnose risk, monitor anyone, send an alert, or replace human help. Urgent support must use local emergency services or the mission medical team without waiting for an album response. The Brazil resource included in this demo is CVV: [188](tel:+55188?oai_link_source=model_response_hotline), [https://www.cvv.org.br/](https://www.cvv.org.br/?oai_link_source=model_response_hotline). Resources need localization and clinical review before use beyond the demo.

## Verification guide

`npm test` runs semantic model and transport tests with `node:test` through `tsx`. It checks interruption and reconnection, the delivery deadline, manual-reply requirements, reply notifications, author/album validation, UTC dates and week boundaries, and support-language cues. Run the commands above to validate your checkout; this guide is not a record of checks performed.

For a manual review, follow the album/reply flow above, reload with a saved draft and a check-in, remove an attached photo, and exercise the paused/offline controls. For the book, check first/last boundaries, odd and even page counts, forward/backward turns, a newly added contribution, and opening a reply directly. Check corner dragging, arrow-key navigation, the focusable text region's native scroll, and the **Page details** disclosure. Repeat with keyboard only: verify visible focus, dialog dismissal and return focus, form labels, and access to help. Check a narrow mobile viewport for portrait book pages, editor controls, long messages, and dialogs without horizontal overflow. Verify that support appears while entering a cue and that the editor remains usable. Real-device touch and runtime OS reduced-motion preference testing remain separate checks. See [VERIFICATION.md](docs/VERIFICATION.md) for completed results and remaining limits.

## Files and deployment

- `src/app/page.tsx`: interactive application and local browser state.
- `src/app/globals.css`: responsive visual styles and focus states.
- `src/app/layout.tsx`: metadata, document language, and self-hosted fonts.
- `src/components/AlbumBook.tsx`: chronological book reader, page-turn interaction, and accessible navigation.
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
