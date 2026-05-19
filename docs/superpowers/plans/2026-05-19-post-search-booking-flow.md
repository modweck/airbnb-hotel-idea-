# Post-search booking flow — implementation plan

**Branch:** `feat/ios-mobile-port` (continuing from the Expo Router port).
**Mockup:** `docs/mockups/post-search-booking/` (overview.png + body-text.txt).
**Product brand in mockup:** STAYBOARD. **Treated as `<TBD-brand>`** in
this plan — copy/logo/domain are placeholder until a final name is
chosen. All references go through a single constant
`src/lib/brand.ts → BRAND_NAME` so the rename is one edit.

## Status (as of 2026-05-19)

All 45 tasks below are now **live GitHub issues** (#40–#84) on the
sprint board (`PVT_kwHOAEjqkc4BYH9J`). Milestones M1–M4 created. See
the **Issue map** section at the bottom for the full mapping.

**For an agent picking this up:** Browse the sprint board (filter by
milestone M1, status Todo, owner=you) and pick the lowest-numbered
unblocked issue. Each issue's body includes the description, the
`[IKKI_ONLY]` / `[MODWECK_OK]` tag, full acceptance criteria, and any
"Blocked by" dependency links.

Implementation of any task happens off the board, one PR per issue.

## Problem

The existing app stops at `/results` — single-user search and `Save`
via kv-store. The Paper.design mockup specifies an entire **group
trip-planning + group-decision + group-booking** layer (7 screens, 8–9
new subsystems). The business goal is to ship the slice that earns us
acceptance into an affiliate program, with the group-booking flow ideally
working at application time.

## Goal

A live universal (web on Netlify + iOS via Expo) app where a user can:
1. Search for a destination (already works).
2. Create a Trip, add listings to its shortlist, share an invite link.
3. Members open the link and vote on listings.
4. Once consensus is reached, the booker opens "Review Booking", sees
   price + cost split, confirms, and gets redirected to the affiliate
   provider URL. Members get an email summary of their share.

The done-state is **good enough to apply to Travelpayouts** with the
group-booking flow demoable end-to-end.

## Confirmed defaults (from user)

| Decision | Choice | Why |
|---|---|---|
| Affiliate strategy v1 | **Travelpayouts** | Pure URL-rewrite, no client SDK — identical implementation on Netlify web and native iOS. Multi-provider (Booking/VRBO/Expedia/Hotels.com) in one signup. Approval typically 1–2 days. |
| Auth v1 | **Anonymous + share-link** | Cookie-bound `member_token`; no sign-up wall. Supabase Auth deferred to v2 — the data model is designed so promoting an anon member to an authed account is a row update, not a rewrite. |
| Brand | **`<TBD-brand>`** | One `BRAND_NAME` constant; mockup-copy "STAYBOARD" used as placeholder. |
| Cost-split payments | **Email summary + manual settlement** | "Ikki paid; you owe Ikki $654" email. Real card capture via Stripe is a separately tracked future task (see Future Work). |
| Milestone target | **Full group booking (M1 → M3)** | M1 alone is enough to submit to Travelpayouts; carrying through M3 makes the application credible and unblocks M2 affiliate programs (VRBO direct, Airbnb Associates) later. |
| Modweck collaboration | **Mix: lane-based + per-task tags** | See Collaboration Model section. |

## Why Travelpayouts (not Stay22 or Booking.com Partners direct)

- **Universal compatibility:** Travelpayouts is API-driven. We rewrite
  `listing.url` server-side during SerpAPI pipeline. Web (Netlify),
  Expo web, native iOS — all behave identically since the only client
  action is `Linking.openURL(rewrittenUrl)`.
- **Stay22** has a richer mobile-app deep-link story (handles "open
  in Booking app if installed") but relies on its JS SDK rewriting at
  render time, which is awkward in React Native and would mean
  branching the implementation per platform.
- **Booking.com Partners direct** = single provider, slower approval,
  higher commission. Worth applying for in M4 *after* we have traffic
  to show.
- **VRBO/Expedia TPID, Airbnb Associates** = both deferred. They need a
  polished site (which is what M1–M3 produce) plus, for Airbnb, often
  a curated approval that's hard to get cold.

## Current codebase relevant to this work

| Path | Status |
|---|---|
| `src/lib/serpapi.ts` | Multi-provider via Google Hotels. Outbound `link` is a Google redirect — must be rewritten through Travelpayouts. |
| `src/lib/saved.ts` + `src/lib/kv-store.{ts,web,native}.ts` | Single-user kv-backed "saved listings". Evolves into `trip-store` (still kv for offline, server-synced when trip exists). |
| `src/lib/supabase.ts` | Universal client already wired. RLS policies don't exist yet — must be added. |
| `src/server/search/pipeline.ts` | Server-only search pipeline. Hook for URL rewrite goes here. |
| `app/results.tsx`, `app/saved.tsx` | Existing client screens — get a new "Add to Trip" affordance in M1. |
| `app/api/{parse-trip,places-autocomplete,search}+api.ts` | Existing API routes. New `app/api/trips/**+api.ts` routes added in M1. |

## Architecture sketch

### Data model (Supabase)

```
trips
  id (uuid, pk)
  slug (text, unique, lowercase) -- used in share link
  title (text)                    -- "Lake Tahoe 2026"
  destination (text)
  check_in (date)
  check_out (date)
  group_size (int)
  owner_member_id (uuid, fk -> trip_members)
  created_at, updated_at

trip_members
  id (uuid, pk)
  trip_id (uuid, fk -> trips)
  member_token (text, unique)     -- cookie value for anon; replaced with user_id post-auth
  user_id (uuid, nullable, fk -> auth.users)  -- v2 (Supabase Auth)
  display_name (text)
  email (text, nullable)
  role (text: 'owner' | 'member')
  created_at

trip_listings                     -- shortlist
  id (uuid, pk)
  trip_id (uuid, fk)
  listing_id (text)               -- SerpAPI property_token
  listing_snapshot (jsonb)        -- frozen Listing payload at add time
  added_by (uuid, fk -> trip_members)
  rank (int)
  created_at

votes
  trip_listing_id (uuid, fk)
  trip_member_id (uuid, fk)
  value (text: 'love_it' | 'pass' | 'unset')
  voted_at
  PRIMARY KEY (trip_listing_id, trip_member_id)

comments
  id (uuid, pk)
  trip_listing_id (uuid, fk)
  trip_member_id (uuid, fk)
  body (text)
  created_at

bookings
  id (uuid, pk)
  trip_id (uuid, fk)
  trip_listing_id (uuid, fk)
  booker_member_id (uuid, fk)
  confirmation_id (text, nullable)  -- user-entered after they book on provider
  total_cents (int)
  per_person_cents (int)
  split_mode (text: 'equal' | 'custom')
  custom_split (jsonb, nullable)
  status (text: 'pending' | 'confirmed')
  created_at, confirmed_at
```

RLS: members can read trips they belong to; only owner can write
trip metadata; any member can write votes/comments scoped to their
own member_id; anon access via a Supabase Edge Function that mints a
short-lived JWT keyed off the `member_token` cookie. (We avoid running
Supabase queries with the anon key directly — too leaky.)

### New code structure

```
src/lib/
  affiliate.ts                -- Travelpayouts URL rewriter (server-only)
  brand.ts                    -- BRAND_NAME, BRAND_DOMAIN constants
  trip-store.ts               -- replaces saved.ts; kv mirror + server sync
  consensus.ts                -- pure fn: votes -> { percent, status, blocker }
src/server/
  trips/
    create.ts, get.ts, addListing.ts, vote.ts, comment.ts, finalizeBooking.ts
  notifications/
    sendBookingSummary.ts     -- M3
app/(trip)/
  _layout.tsx                 -- Trip-scoped layout w/ member-token guard
  [slug]/
    index.tsx                 -- Trip Board
    listing/[listingId]/
      index.tsx               -- Listing Detail
      comments.tsx            -- Listing Comments
    invite.tsx                -- Invite Sheet
    book/
      review.tsx              -- Booking Review
      split.tsx               -- Cost Split
      confirmed.tsx           -- Confirmed
app/api/trips/
  create+api.ts
  [slug]/
    +api.ts                   -- GET trip
    members+api.ts            -- POST invite
    listings+api.ts           -- POST add listing
    listings/[id]/vote+api.ts -- PUT vote
    listings/[id]/comments+api.ts -- POST comment, GET list
    book+api.ts               -- POST finalize booking
```

### Realtime strategy

- **M1–M2:** Poll on screen mount + manual pull-to-refresh + invalidate-on-action. Avoids Supabase Realtime complexity until we need it.
- **M3 / future:** Add Supabase Realtime subscriptions for `votes` and `comments` only if the polling UX feels bad.

### Affiliate link rewriter

`src/lib/affiliate.ts`:

```ts
export function rewriteOutboundUrl(originalUrl: string, opts: {
  clickId: string;          // <trip_id>:<member_id>:<listing_id>
}): string
```

Wraps `originalUrl` with Travelpayouts' deep-link endpoint and our
marker. Called server-side in the SerpAPI pipeline (so anonymous users
also get tagged links). Also called when constructing the
"BOOK THIS PLACE" / "VIEW VRBO LISTING" CTA URLs.

## Milestones

### M1 — Foundation (Travelpayouts-submittable)

Outcome: a public Netlify deploy where a logged-out visitor can
search, save a listing, name a trip, get a share link, and have every
outbound listing click already tagged with our Travelpayouts marker.

Tasks (executed in roughly this order):

1. `[IKKI_ONLY]` Sign up for Travelpayouts; record `marker` + base URL
   in `.env.local.example`. Note: nothing here ships in code, just
   account setup.
2. `[IKKI_ONLY]` Add `src/lib/brand.ts` with `BRAND_NAME = "<TBD-brand>"`, `BRAND_DOMAIN = "tbd.example"`. Replace literal "STAYBOARD" / "stayboard.app" anywhere they slip in.
3. `[IKKI_ONLY]` Add `src/lib/affiliate.ts` with `rewriteOutboundUrl`. Unit tests for URL building.
4. `[IKKI_ONLY]` Wire rewriter into `src/server/search/pipeline.ts` — every `Listing.url` gets rewritten with an opaque clickId placeholder before the API returns.
5. `[IKKI_ONLY]` Supabase migration: `trips`, `trip_members`, `trip_listings` + RLS policies. SQL goes in `supabase/migrations/`.
6. `[IKKI_ONLY]` `src/lib/trip-store.ts` replacing `saved.ts`. Existing `app/saved.tsx` keeps working via a thin compat shim.
7. `[IKKI_ONLY]` `app/api/trips/create+api.ts` + `app/api/trips/[slug]+api.ts`.
8. `[MODWECK_OK]` `app/(trip)/[slug]/index.tsx` — Trip Board UI (mobile layout first). Acceptance test: given a trip with 3 listings in fixture state, board renders all 3 with placeholder vote status. **Pre-defined tests in the task spec.**
9. `[MODWECK_OK]` `app/(trip)/[slug]/listing/[listingId]/index.tsx` — Listing Detail UI. Acceptance test: renders fixture listing with photos/amenities/about. Vote pill says "VOTE FOR THIS" (M2 wires action).
10. `[MODWECK_OK]` "Add to Trip" affordance in `app/results.tsx` (button per result) + small modal/sheet "create new trip OR add to existing". UI only; calls existing trip API.
11. `[IKKI_ONLY]` Wire CTA "VIEW LISTING" buttons to rewritten URLs. Confirm in browser devtools that the outbound URL goes through Travelpayouts.
12. `[IKKI_ONLY]` Smoke test on iOS sim (`Linking.openURL` opens provider in mobile Safari with tag intact).
13. `[IKKI_ONLY]` Apply to Travelpayouts. **This is the gate.** Don't start M2 until the application is submitted.

### M2 — Group decision

Outcome: members can be invited, vote on listings, comment on
listings, and see consensus in near-real-time.

Tasks:

14. `[IKKI_ONLY]` Supabase migration: `votes`, `comments`. RLS scoped to trip membership.
15. `[IKKI_ONLY]` `src/lib/consensus.ts` — pure function `computeConsensus(votes, memberCount) -> { percent, status: 'top_pick'|'split_vote'|'needs_votes', blocker?: memberName }`. Tested in isolation.
16. `[IKKI_ONLY]` Invite-link minting: short slug + token rotation. POST `members+api.ts`.
17. `[MODWECK_OK]` `app/(trip)/[slug]/invite.tsx` — Invite Sheet UI. Acceptance test: rendering with 3 members + share link.
18. `[MODWECK_OK]` Member-join landing: user opens share link → cookie set → redirected to trip board with a "Welcome to the trip" toast.
19. `[IKKI_ONLY]` `vote+api.ts` PUT endpoint.
20. `[MODWECK_OK]` Vote-pill component (love it / pass / unset) in Listing Detail wired to API. Optimistic update.
21. `[IKKI_ONLY]` `comments+api.ts` GET + POST.
22. `[MODWECK_OK]` `app/(trip)/[slug]/listing/[listingId]/comments.tsx` — Comments thread UI.
23. `[IKKI_ONLY]` Poll-on-mount + pull-to-refresh on Trip Board + Listing Detail. Decide if Realtime is needed (probably not yet).
24. `[MODWECK_OK]` Empty/loading/error states for Trip Board, Listing Detail, Comments.

### M3 — Booking flow

Outcome: when consensus crosses the threshold (defined as 80% love-it
per mockup, configurable), the booker opens Review → Cost Split →
Confirmed, the provider URL is opened, and an email summary is sent.

Tasks:

25. `[IKKI_ONLY]` Supabase migration: `bookings`.
26. `[IKKI_ONLY]` Price-math + cost-split utilities in `src/lib/split.ts` (already partially exists — extend). Tests.
27. `[MODWECK_OK]` `app/(trip)/[slug]/book/review.tsx` — UI per mockup; "REVIEW COST SPLIT" CTA gated on consensus.
28. `[MODWECK_OK]` `app/(trip)/[slug]/book/split.tsx` — Equal/Custom toggle; per-member rows.
29. `[IKKI_ONLY]` `book+api.ts` POST: creates booking row, returns affiliate URL.
30. `[IKKI_ONLY]` Email notification via Supabase Edge Function + Resend (or Supabase SMTP if simpler): subject "You owe Ikki $654 for Lake Tahoe 2026 — settle via Venmo/Zelle".
31. `[MODWECK_OK]` `app/(trip)/[slug]/book/confirmed.tsx` — confirmation screen + "Share with group" CTA.
32. `[IKKI_ONLY]` Conf-ID entry flow: after the booker books on provider, a follow-up email/in-app prompt asks them to paste the conf ID; saved to `bookings.confirmation_id`.
33. `[MODWECK_OK]` Marketing copy pass on `app/index.tsx` (the hero) calling out the group-booking value proposition.
34. `[IKKI_ONLY]` End-to-end test: cypress/playwright run that walks the full happy path on the Netlify preview.

### M4 — Auth + polish (post-affiliate-application)

Tasks (these can be parallelised with M3 if needed):

35. `[IKKI_ONLY]` Supabase Auth: email magic-link + Google OAuth. Anon-member-token → user_id promotion logic.
36. `[IKKI_ONLY]` Sign-in screen + protected-route layout.
37. `[MODWECK_OK]` Dark-mode theme (mockup already shows it; just need NativeWind theme toggling).
38. `[MODWECK_OK]` Desktop layouts for Trip Board, Listing Detail, Invite Sheet, Booking screens.
39. `[IKKI_ONLY]` Accessibility audit (axe / RN a11y inspector).
40. `[IKKI_ONLY]` Apply to **Booking.com Partners direct** and **VRBO/Expedia TPID** (now that we have traffic + a polished group-booking story).

## Collaboration model

**Lane-based defaults:**
- **modweck owns:** `src/components/**` (presentational), `app/(trip)/**` (screens — UI/copy only), `src/lib/copy/**` if it gets created, marketing strings in `app/index.tsx`.
- **ikki owns:** `src/server/**`, `app/api/**`, `src/lib/affiliate.ts`, `src/lib/auth.ts` (M4), all Supabase migrations + RLS, all environment + secrets work.

**Per-task tags override the lane** when a task is ambiguous:
- `[MODWECK_OK]` — modweck can take it. Each task spec includes pre-written acceptance tests so review is "diff + tests pass" not "read every line."
- `[IKKI_ONLY]` — ikki only. Anything touching the server, auth, secrets, or RLS.

**Process guardrails:**
- All PRs require review by ikki, regardless of tag. Squash merges only.
- `[MODWECK_OK]` tasks must have acceptance tests written **before** the task is assigned. If no test can be defined, the task is `[IKKI_ONLY]`.
- modweck works against the `feat/ios-mobile-port` branch via short-lived feature branches named `<jira-or-issue>-short-description` (no Jira here — use GitHub issue numbers or descriptive names).
- Feature flags (a simple `src/lib/flags.ts` constant) gate any UI that's not done end-to-end so partial work doesn't ship broken.

## Future work (tracked, out of scope for v1)

- **Stripe card capture** for true in-app cost-split payments. Will require PCI compliance review.
- **VRBO direct affiliate** (Expedia Group TPID) — submit in M4.
- **Airbnb Associates** — submit when site has 3+ months of traffic.
- **Native iOS app store submission** (TestFlight first).
- **Push notifications** ("Maurice voted on Modern A-Frame") via Expo Notifications.
- **Trip itinerary tab** (mockup shows a tab next to Board/Chat — not in scope yet).
- **Realtime via Supabase Realtime** (if M2 polling feels bad).
- **Multi-language / multi-currency** for non-US markets.

## Open questions (defer; not blocking)

- Final brand name. Pick before M3 marketing copy lands; one constant
  swap.
- Email provider: Resend vs Supabase SMTP vs Postmark. Defer to M3.
- Consensus threshold: hardcoded 80% per mockup, or configurable
  per trip? Default to hardcoded; revisit if real users complain.
- Conf-ID entry UX: in-app modal vs follow-up email-only. Defer to M3.

## What this plan does NOT cover

- The original Expo Router port (Phases 1–14). That's already done;
  this is the next chapter. See
  `docs/superpowers/plans/2026-05-18-expo-router-port.md` and the
  finished status table there.
- Choosing the brand name. Placeholder until you decide.
- Choosing the consensus threshold beyond the mockup's 80%.

## Issue map

| # | Task | Owner | Size |
|---|---|---|---|
| | **M1 Foundation** | | |
| [#40](https://github.com/modweck/airbnb-hotel-idea-/issues/40) | `m1-travelpayouts-signup` | ikkidev | S |
| [#41](https://github.com/modweck/airbnb-hotel-idea-/issues/41) | `m1-brand-constant` | ikkidev | S |
| [#42](https://github.com/modweck/airbnb-hotel-idea-/issues/42) | `m1-affiliate-rewriter` | ikkidev | M |
| [#43](https://github.com/modweck/airbnb-hotel-idea-/issues/43) | `m1-pipeline-hook` | ikkidev | S |
| [#44](https://github.com/modweck/airbnb-hotel-idea-/issues/44) | `m1-supabase-migration` | ikkidev | L |
| [#45](https://github.com/modweck/airbnb-hotel-idea-/issues/45) | `m1-trip-store` | ikkidev | M |
| [#46](https://github.com/modweck/airbnb-hotel-idea-/issues/46) | `m1-trips-api` | ikkidev | M |
| [#47](https://github.com/modweck/airbnb-hotel-idea-/issues/47) | `m1-trip-board-ui` | modweck | L |
| [#48](https://github.com/modweck/airbnb-hotel-idea-/issues/48) | `m1-listing-detail-ui` | modweck | L |
| [#49](https://github.com/modweck/airbnb-hotel-idea-/issues/49) | `m1-add-to-trip` | modweck | M |
| [#50](https://github.com/modweck/airbnb-hotel-idea-/issues/50) | `m1-cta-rewrite` | ikkidev | S |
| [#51](https://github.com/modweck/airbnb-hotel-idea-/issues/51) | `m1-ios-smoke` | ikkidev | S |
| [#52](https://github.com/modweck/airbnb-hotel-idea-/issues/52) | `m1-travelpayouts-apply` | ikkidev | S |
| | **M2 Group decision** | | |
| [#53](https://github.com/modweck/airbnb-hotel-idea-/issues/53) | `m2-votes-comments-migration` | ikkidev | M |
| [#54](https://github.com/modweck/airbnb-hotel-idea-/issues/54) | `m2-consensus` | ikkidev | S |
| [#55](https://github.com/modweck/airbnb-hotel-idea-/issues/55) | `m2-invite-api` | ikkidev | M |
| [#56](https://github.com/modweck/airbnb-hotel-idea-/issues/56) | `m2-invite-ui` | modweck | M |
| [#57](https://github.com/modweck/airbnb-hotel-idea-/issues/57) | `m2-member-join` | modweck | M |
| [#58](https://github.com/modweck/airbnb-hotel-idea-/issues/58) | `m2-vote-api` | ikkidev | S |
| [#59](https://github.com/modweck/airbnb-hotel-idea-/issues/59) | `m2-vote-pill` | modweck | M |
| [#60](https://github.com/modweck/airbnb-hotel-idea-/issues/60) | `m2-comments-api` | ikkidev | S |
| [#61](https://github.com/modweck/airbnb-hotel-idea-/issues/61) | `m2-comments-ui` | modweck | M |
| [#62](https://github.com/modweck/airbnb-hotel-idea-/issues/62) | `m2-polling` | ikkidev | S |
| [#63](https://github.com/modweck/airbnb-hotel-idea-/issues/63) | `m2-empty-states` | modweck | S |
| | **M3 Booking flow** | | |
| [#64](https://github.com/modweck/airbnb-hotel-idea-/issues/64) | `m3-bookings-migration` | ikkidev | M |
| [#65](https://github.com/modweck/airbnb-hotel-idea-/issues/65) | `m3-split-math` | ikkidev | S |
| [#66](https://github.com/modweck/airbnb-hotel-idea-/issues/66) | `m3-review-ui` | modweck | M |
| [#67](https://github.com/modweck/airbnb-hotel-idea-/issues/67) | `m3-split-ui` | modweck | M |
| [#68](https://github.com/modweck/airbnb-hotel-idea-/issues/68) | `m3-book-api` | ikkidev | M |
| [#69](https://github.com/modweck/airbnb-hotel-idea-/issues/69) | `m3-email-summary` | ikkidev | L |
| [#70](https://github.com/modweck/airbnb-hotel-idea-/issues/70) | `m3-confirmed-ui` | modweck | M |
| [#71](https://github.com/modweck/airbnb-hotel-idea-/issues/71) | `m3-confid-flow` | ikkidev | M |
| [#72](https://github.com/modweck/airbnb-hotel-idea-/issues/72) | `m3-marketing-hero` | modweck | S |
| [#73](https://github.com/modweck/airbnb-hotel-idea-/issues/73) | `m3-e2e-test` | ikkidev | L |
| | **M4 Auth + polish** | | |
| [#74](https://github.com/modweck/airbnb-hotel-idea-/issues/74) | `m4-supabase-auth` | ikkidev | XL |
| [#75](https://github.com/modweck/airbnb-hotel-idea-/issues/75) | `m4-signin-ui` | ikkidev | M |
| [#76](https://github.com/modweck/airbnb-hotel-idea-/issues/76) | `m4-dark-mode` | modweck | M |
| [#77](https://github.com/modweck/airbnb-hotel-idea-/issues/77) | `m4-desktop-layouts` | modweck | L |
| [#78](https://github.com/modweck/airbnb-hotel-idea-/issues/78) | `m4-a11y` | ikkidev | M |
| [#79](https://github.com/modweck/airbnb-hotel-idea-/issues/79) | `m4-direct-affiliates` | ikkidev | M |
| | **Future** | | |
| [#80](https://github.com/modweck/airbnb-hotel-idea-/issues/80) | `future-stripe` | ikkidev | XL |
| [#81](https://github.com/modweck/airbnb-hotel-idea-/issues/81) | `future-airbnb` | ikkidev | M |
| [#82](https://github.com/modweck/airbnb-hotel-idea-/issues/82) | `future-push` | modweck | L |
| [#83](https://github.com/modweck/airbnb-hotel-idea-/issues/83) | `future-itinerary` | modweck | XL |
| [#84](https://github.com/modweck/airbnb-hotel-idea-/issues/84) | `future-realtime` | ikkidev | M |
