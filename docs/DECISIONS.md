# Still Here: product and implementation decisions

The complementary palette now uses slate-blue text, olive actions, and richer cloth covers in ochre (`#7b6744`), olive (`#60705a`), clay (`#88614f`), and slate (`#527080`). Cream cover lettering (`#f8eedc`) maintains normal-text contrast from 4.58:1 to 4.72:1. The approved cream backgrounds, surfaces, and light-mode paper remain unchanged. Navigation, avatars, delivery states, physical book bindings, and the navy night mode use the same coordinated color tokens.

The light palette uses a visible warm cream background (`#f2e7d4`), with cream surfaces and paper. Albums stand upright on a continuous light-maple display ledge, arranged four across on desktop and two per row on mobile. Their names, story titles, dates, and update states remain; relationship subtitles are omitted. The night palette retains its navy background and uses darker wooden ledges.

The interface has no global header bar. The astronaut's name identifies the space in the upper-left corner; switching a demo family perspective does not change that identity. New-page actions appear at the bottom of the home content and after the book's page controls and details. Settings, including the demo profiles and night-mode switch, are available in the footer.

## Purpose and evidence

Still Here explores how shared albums can preserve ordinary moments across a long separation. A page is a contribution to an ongoing relationship, with room for a later reply. Immediate availability is not assumed.

NASA's Human Research Roadmap gap BMed-106 and the 2026 family-conferencing study motivate the problem. They do not validate this interface or establish that this prototype improves well-being. [SOURCES.md](SOURCES.md) records the primary sources, their findings, and application limits. In particular, the study examined delays measured in seconds in a short laboratory setting; it did not establish this design's effectiveness for a long Mars mission.

## Honest MVP boundary

The application is a local-first **DEMO**, with that status visible in its interface. All data and profile perspectives exist inside one browser. The MVP provides neither authentication nor backend persistence, and it cannot send a page to another person or device. Example people and conversations are fictional; illustrative photographs are credited in [ASSETS.md](ASSETS.md).

Connection settings expose Alex, Lily, Sam, Maya, and June as demo perspectives. This allows a reviewer to create both sides of a conversation deliberately. It is not a sign-in system. UI filtering and author validation help demonstrate the intended interaction but do not create a security boundary: anyone with access to the browser can inspect or change its local data.

## A book for each shared story

Opening an album shows a physical-book reader rather than a timeline. Each contribution is a page, ordered by its creation time from oldest to newest. The paper, binding, page stack, folding leaf, and moving shadows support the album metaphor. Forward and backward turns, including corner dragging, preserve the sense of turning a sheet rather than sliding cards.

The reader uses `src/components/AlbumBook.tsx` and `src/components/album-book.css`, with the page-fold engine supplied by `@openpageflip/react` and `@openpageflip/core`. The lockfile records the installed versions. Author, full UTC date, page position, and delivery status remain visible without a repeated explanatory paragraph on every page. A reply opens its corresponding contribution in the reader.

Previous/next controls and arrow-key navigation complement pointer interaction. Narrow screens use a portrait, single-page layout. The reduced-motion media query and effect are implemented to use the engine's instant navigation instead of animated turns; runtime testing of the OS preference remains pending. Long contributions stay inside a focusable region with native scrolling within the paper page, without a separate full-text modal. The **Page details** disclosure provides additional delivery information. Book navigation does not change delivery state, mark a page read for another participant, or generate a response.

## Less copy, information when needed

The home and editor focus on choosing a person, reading, and adding a page. Repeated slogans and prominent response-time reassurance are removed. The “no rush” explanation is available in the existing **How it works** modal through a discreet footer link. Operational status is still conveyed where it matters: a paused connection, an unsaved draft, or an unavailable browser store must remain clear.

Copy reduction does not remove the local-demo boundary, private check-in/storage information, or immediate support and emergency guidance. Those explain material limits or help the person make a decision, rather than repeating the product's mood.

## Pages and simulated transport

The delivery state describes what the prototype knows:

| State     | Meaning in this demo                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Recorded  | The contribution is saved locally and awaits the connection simulator.                                       |
| Sent      | The simulator has accepted the contribution and started its transit deadline.                                |
| Delivered | The 12-second simulated deadline has elapsed and a connected, unpaused simulator has applied the transition. |
| Answered  | A manually authored reply from the other participant in the same album has itself been delivered.            |

The simulated deadline is measured from sending; it is not a count of connected seconds. Offline and pause controls stop transitions. If the deadline elapses during an interruption, delivery may complete when the simulation resumes. There is no arrival promise, real acknowledgment from a recipient, or operational delay model behind these labels.

No timeout invents a reply or marks silence as a response. A same-author or cross-album contribution cannot answer the original page. Reply notifications appear for the original author's perspective after the reply is delivered. Opening a notification changes local notification state; it does not send a read receipt to another participant.

The interface avoids typing indicators, recipient read receipts, streaks, rankings, and activity targets. Page count and response speed are not proxies for relationship health. Dates retain a complete calendar date; model date formatting and week keys use UTC to stay consistent across locations.

## Persistence and drafts

Versioned `localStorage` holds the demo data schema. Pages and delivered replies support the shared demonstration; drafts are keyed by both profile and album, and weekly check-ins are associated with a profile. Draft autosave preserves work when leaving the editor or reloading the page.

Local persistence is not encryption, access control, cross-device synchronization, or a backup. Browser storage is quota-limited and can be removed by the browser or user. Errors must be visible rather than silently presented as a successful save. Offline editing refers to an already loaded application; a demo transport toggle alone is not evidence of an installable app or a guaranteed cold start without connectivity.

## Photo handling

Input is limited to JPEG, PNG, and WebP files of at most 10 MB. The browser decodes and re-encodes the image through canvas as JPEG, with a maximum longest edge of 1,280 pixels and an output target of roughly 350 KB. Original EXIF metadata is not copied. This reduces local-storage use and avoids retaining source camera/location metadata; it does not encrypt the picture or hide its visible content.

The editor permits removing the photo before recording the page. Base64 storage adds overhead, and browser quotas remain a constraint even after compression. The current design does not provide a remote media store, retention service, or production-grade image-processing pipeline.

## Weekly check-in

Connection, loneliness, and perceived support are separate, labeled 1–5 self-report responses with an optional note. They are saved for the active demo profile, and the current week's entry can be edited. Week boundaries are Monday in UTC.

No composite score, diagnostic label, risk classification, or alert to a third party is derived from these answers. The numbers have meaning only alongside their individual question labels; an increase in loneliness should not be interpreted like an increase in connection or support. Message frequency and album participation do not alter check-in answers.

## Immediate support

Help is available independently of writing or completing a check-in. Phrase matching in the editor and check-in note can surface an immediate, nonblocking support panel. Its English and Portuguese cues are a limited heuristic: it cannot reliably understand context, negation, intent, or every expression of distress. False positives and missed cues are expected limitations. It does not diagnose, contact anyone, or prevent a user from continuing.

The panel directs urgent situations to local emergency services or the mission medical team without waiting for a delayed album response. The demo includes a Brazil-specific CVV resource verified through the helpline lookup tool. This is a localized example, not a resource suitable for every country or mission. Production work must include clinical review, accessible wording, supported-language evaluation, current regional resources, and a clear operational response protocol.

## Stack and static deployment

The implementation uses Next.js 16.4.6, TypeScript, React 19, and Tailwind CSS 4. `next.config.ts` sets static export, producing `out/` for static hosting. There are no server routes, required secrets, or runtime API credentials in the MVP. Fonts and illustrative covers are self-hosted.

Use `npm ci` to install the lockfile, `npm run dev` for local development, `npm run typecheck` for TypeScript checking, `npm test` for model tests, and `npm run build` followed by `npm run preview` to inspect the export. `next start` does not serve this static-export workflow.

`.openai/hosting.json` records the Sites project binding and `out/` directory. The review deployment remains private through Sites access settings; that file is not itself an authentication mechanism. The application source is maintained on the original GitHub repository's `main` branch. A release has two distinct steps: push the validated source to GitHub and deploy its matching build through Sites.

## Verification approach

The `node:test` suite, executed through `tsx`, focuses on domain behavior: delivery interruption/reconnection, deadline handling, valid reply relationships, notifications, UTC dates/week boundaries, and a bounded set of support cues. Passing those tests cannot establish clinical safety, accessibility, or actual network delivery.

Manual acceptance should follow complete flows: open a book; navigate to its first and last pages; turn forward and backward; add a contribution; create and reload a draft; attach and remove a photo; record while offline; resume simulated delivery; switch perspective; author and deliver a reply; open the result on its book page; and create, reload, and edit a weekly check-in. Reader review should include odd/even page counts, a one-page album, corner dragging, portrait mode, keyboard controls, reduced motion, the focusable text region's native scrolling, and the **Page details** disclosure. Keyboard and mobile review should also cover focus visibility, dialog close/return behavior, labels, help access, and overflow. [VERIFICATION.md](VERIFICATION.md) records completed browser checks and distinguishes viewport testing from remaining real-device touch and runtime OS reduced-motion checks.

## Required before production

- Authenticated backend storage and explicit authorization/RBAC for album membership, profiles, and media.
- Encryption in transit and at rest, secure session handling, consent, retention, deletion, and appropriate protection for sensitive notes and check-ins.
- A delay-tolerant transport with durable queues, idempotency, duplicate handling, retries, and meaningful acknowledgments; product states must reflect actual evidence from that transport.
- Clinical review of support behavior and self-report language, with current localized resources and internationalization rather than reliance on a small bilingual phrase list.
- Evaluation with intended users of perceived connection, usability, accessibility, privacy, and effects over time. A successful demonstration or busy album does not establish a health benefit.

Concurrent tabs are intentionally guarded rather than merged: an external storage change pauses writes in the stale tab, keeps that session visible, and asks the reviewer to keep unsaved words before reloading. Use one editing tab at a time. Invalid stored snapshots are rejected as a whole and left untouched rather than silently filtered.
