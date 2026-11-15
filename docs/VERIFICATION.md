# Verification record

Reviewed November 14, 2026 (America/Sao_Paulo). This is a functional prototype review, not clinical validation or a full accessibility audit.

## Automated

- TypeScript strict checking passes.
- 16 semantic tests pass: interrupted transport, reconnection, delivery deadline, valid manual replies and notifications, UTC dates and weeks, support cues, complete persistence roundtrips, malformed records, duplicate IDs, and unsafe image URLs.
- Next.js production static export completes successfully.

## Browser flows

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

## Contrast and motion

Core text pairs were checked against WCAG AA's 4.5:1 normal-text threshold, including muted copy on cream, sage surfaces, amber support panels, and navy mode. Borders, photographs, and decorative orbit lines are not text. Reduced-motion preference disables animations and transitions. These checks do not substitute for an independent assistive-technology or full WCAG audit. [W3C contrast requirement](https://www.w3.org/WAI/WCAG20/Understanding/contrast-minimum.html).

## Remaining operational boundary

All delivery tests use the clearly labeled simulator. They do not verify communication between devices, secure accounts, encryption, backups, or real spacecraft transport. The support heuristic has false positives and false negatives. See [DECISIONS.md](DECISIONS.md) for the production work required.
