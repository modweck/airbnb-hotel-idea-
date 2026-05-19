# Post-search booking flow — mockup snapshot

**Source of truth:** the Paper.design file at
<https://app.paper.design/file/01KRH01R9QN0JB70X7C50QKQT5>
(also stored at `docs/paper_mockup.md` on
`feat/post-search-booking-flow-mockup`).

The files in this folder are a **static snapshot** captured on
2026-05-19 so reviewers and contributors who can't open Paper still have
something readable.

| File | What it is |
|---|---|
| `overview.png` | Full-board render of every frame (Mobile + Desktop, Light + Dark). |
| `body-text.txt` | Flattened text content of every frame in reading order. Useful for searching copy. |

The mockup covers 7 screens × 2 themes × 2 form factors:

1. **Trip Board** — the group's saved listings with vote status.
2. **Listing Detail** — drill-in with photos, amenities, per-member vote.
3. **Listing Comments** — threaded discussion per listing.
4. **Invite Sheet** — share-link + email invite.
5. **Booking — Review** — price breakdown, gated on consensus.
6. **Booking — Cost Split** — equal/custom split, booker collects.
7. **Booking — Confirmed** — confirmation summary + conf ID.

Product brand in the mockup: **STAYBOARD**.

When the Paper file changes, regenerate the snapshot:

```bash
# from /tmp or anywhere with playwright installed
node render.js  # see ~/.copilot/session-state/<id>/files/ for the script
```
