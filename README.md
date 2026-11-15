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

1. Open an album, add a written moment or a photo, and leave the editor to check that its draft is saved.
2. Use connection settings to pause simulated delivery or simulate being offline. A recorded page stays in this browser until the simulator can advance it.
3. Resume the connection to see **Recorded → Sent → Delivered**. Delivery uses a 12-second simulated deadline; an offline or paused simulator makes no transitions. If the deadline passes during a pause, pending delivery can complete on reconnection. This is not a real network guarantee or a promised arrival time.
4. In connection settings, switch from Alex to Lily, Sam, Maya, or June. Open the relevant album and manually reply to a delivered page. Switch back after that reply is delivered to see its notification and the original page marked **Answered**. A timer never writes a human reply.
5. Open the weekly check-in. Connection, loneliness, and support are separate labeled 1–5 responses. The current week's check-in can be edited; there is no composite health score, diagnosis, or automatic third-party alert.

There are no typing indicators, recipient read receipts, streaks, rankings, or measures that treat message quantity as relationship health. The local notification state only tracks which reply notifications have been opened in this demo.

## Local data and photos

Versioned `localStorage` stores pages, drafts, check-ins, and reply-notification state. Use one editing tab at a time: if another tab changes saved data, writes pause in the stale tab and a recovery notice preserves the original saved version. Invalid saved snapshots are left untouched. Drafts are separated by profile and album; check-ins belong to a profile. **Profile switching is a demonstration control, not authentication, security isolation, or encryption. Anyone using this browser can inspect all stored data.** Clearing site data removes the demo's saved content, and no server backup exists. Use fictional content when evaluating it on a shared device.

The photo editor accepts JPEG, PNG, and WebP files up to 10 MB. It uses canvas to produce a JPEG with a longest edge of at most 1,280 pixels and a target size of roughly 350 KB, without copying original EXIF metadata. A photo can be removed before recording the page. Storage overhead and browser quota still apply; the compressed result is stored locally.

## Support behavior

Help is always available. Limited English and Portuguese phrase matching also surfaces a nonblocking support panel while typing in the editor or a check-in note. It can miss a crisis or match unrelated text; it does not diagnose risk, monitor anyone, send an alert, or replace human help. Urgent support must use local emergency services or the mission medical team without waiting for an album response. The Brazil resource included in this demo is CVV: [188](tel:+55188?oai_link_source=model_response_hotline), [https://www.cvv.org.br/](https://www.cvv.org.br/?oai_link_source=model_response_hotline). Resources need localization and clinical review before use beyond the demo.

## Verification guide

`npm test` runs semantic model and transport tests with `node:test` through `tsx`. It checks interruption and reconnection, the delivery deadline, manual-reply requirements, reply notifications, author/album validation, UTC dates and week boundaries, and support-language cues. Run the commands above to validate your checkout; this guide is not a record of checks performed.

For a manual review, follow the album/reply flow above, reload with a saved draft and a check-in, remove an attached photo, and exercise the paused/offline controls. Repeat with keyboard only: check visible focus, dialog dismissal and return focus, form labels, and access to help. Check a narrow mobile viewport for navigation, editor controls, long messages, and dialogs without horizontal overflow. Verify that help appears while entering a cue and that the editor remains usable.

## Files and deployment

- `src/app/page.tsx`: interactive application and local browser state.
- `src/app/globals.css`: responsive visual styles and focus states.
- `src/app/layout.tsx`: metadata, document language, and self-hosted fonts.
- `src/lib/model.ts`: domain types, sample data, delivery reducer, notifications, and check-in/date helpers.
- `src/lib/model.test.ts` and `src/lib/storage.test.ts`: model, transport, and persistence behavior tests.
- `next.config.ts`: static export configuration.
- `.openai/hosting.json`: Sites project binding and the `out` static directory.
- [Research sources](docs/SOURCES.md), [product and technical decisions](docs/DECISIONS.md), and [image credits](docs/ASSETS.md).

Build before deploying through Sites. The review deployment is intended to remain private; access is controlled by the Sites deployment settings. `.openai/hosting.json` binds this checkout to a hosting project and identifies `out/` as the static directory. A Sites deployment does not commit or push source to the original GitHub repository automatically.

A production service needs authenticated backend storage, authorization/RBAC, encryption, a delay-tolerant transport with idempotency and acknowledgments, and review of consent, accessibility, clinical behavior, and localized support resources. See [DECISIONS.md](docs/DECISIONS.md) for the boundary between the demonstration and that work.
