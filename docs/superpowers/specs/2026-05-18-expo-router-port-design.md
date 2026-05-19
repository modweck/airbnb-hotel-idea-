# Universal Expo Router Port — Design Spec

**Status:** Draft (under review)
**Branch:** `feat/expo-port`
**Author:** Ikki Lachance

## 1. Problem

The product (an AI trip-planning "decision engine") currently ships as
a Next.js 16 web app deployed to Netlify. Long-term direction is a
group-travel collaboration product targeting iOS first, web second.

A native presence is required for the planned collaboration features
(shared trips, real-time updates, invite deep-links, push
notifications). Maintaining a parallel native codebase alongside the
Next.js web app would double the cost of every feature.

## 2. Goal

Replace the Next.js codebase with a single **Expo Router** project that
serves iOS, Android, and web from one tree, on one feature branch
(`feat/expo-port`), without regressing the existing user-visible
functionality on the web target.

iOS is the primary native target. Android must build but is not
actively tested. Web continues to deploy to Netlify.

## 3. Non-goals (this branch)

- Sign-in / auth UI (Supabase auth UI does not exist on `main` today
  and is not added here; client wiring is preserved).
- Group-collaboration features (post-port roadmap).
- EAS Build, EAS Submit, or any App Store / Play Store submission
  pipeline.
- TestFlight / Play Internal Testing distribution.
- Migration of `lib/saved.ts` from localStorage to a Supabase-backed
  per-user store.
- Renaming the product (footer still shows `[SITE NAME]` —
  out of scope).

## 4. Locked decisions

These were resolved during brainstorming and inform the rest of the
spec.

| # | Decision | Choice |
|---|----------|--------|
| 1 | Codebase strategy | Universal Expo Router (single tree, three targets) |
| 2 | Scope on this branch | Full migration; Next.js removed by end of branch |
| 3 | Backend / API routes | Expo Router API routes (`+api.ts`) |
| 4 | Styling | NativeWind v4 + Tailwind v4 |
| 5 | Web rendering | `web.output: "server"` (global, not per-route) |
| 6 | Deployment | Netlify (web only); local dev only for native |
| 7 | Native targets | iOS primary, Android compatible-but-untested |
| 8 | Local environment | WSL; iOS validation handed off to MacBook Pro |
| 9 | Test runner | Vitest stays for pure logic; no jest-expo migration |
| 10 | Supabase client | `@supabase/supabase-js` with platform-conditional storage |

## 5. Architecture

### 5.1 Repo layout (post-migration)

```
/                            (repo root)
├── app/                     Expo Router tree
│   ├── _layout.tsx          root layout: fonts, GA on web, NativeWind
│   ├── index.tsx            home (was src/app/page.tsx)
│   ├── results.tsx          results (was src/app/results/page.tsx)
│   ├── saved.tsx
│   ├── about.tsx
│   ├── contact.tsx
│   ├── privacy.tsx
│   ├── terms.tsx
│   └── api/
│       ├── parse-trip+api.ts
│       ├── places-autocomplete+api.ts
│       └── search+api.ts
├── src/
│   ├── components/          universal React Native components
│   ├── client/              client-safe helpers (typed API wrappers)
│   │   ├── search.ts        wraps POST /api/search
│   │   ├── places.ts        wraps GET /api/places-autocomplete
│   │   └── trip.ts          wraps POST /api/parse-trip
│   ├── server/              SERVER-ONLY — never imported by universal code
│   │   ├── search/
│   │   │   ├── pipeline.ts  searchTrip() — extracted /results logic
│   │   │   ├── serpapi.ts
│   │   │   ├── listing-provider.ts
│   │   │   ├── geocode.ts
│   │   │   └── vibe.ts
│   │   └── ai/
│   │       └── parse-trip.ts
│   ├── lib/                 universal helpers (no secrets)
│   │   ├── supabase.ts      universal client factory
│   │   ├── kv-store.ts      platform-conditional storage adapter
│   │   ├── saved.ts         localStorage-equivalent, uses kv-store
│   │   ├── budget.ts
│   │   ├── sleep-rules.ts
│   │   ├── trip-schema.ts   (zod schemas, shared with server)
│   │   ├── analytics.ts
│   │   └── types.ts
│   └── data/
│       └── seed-listings.ts
├── assets/                  fonts, icons, splash
├── public/                  static web assets (kept from current)
├── db/                      Supabase schema (unchanged)
├── docs/
│   ├── superpowers/specs/   this file
│   └── mobile-handoff.md    MBP/Claude validation guide
├── app.json                 Expo config
├── metro.config.js          NativeWind + web bundler
├── tailwind.config.js       Tailwind tokens (shared web + native)
├── global.css               Tailwind directives (web)
├── babel.config.js          Expo + NativeWind preset
├── tsconfig.json            extends `expo/tsconfig.base`
├── netlify.toml             rewritten for Expo server adapter
├── eas.json                 stub for future EAS Build phase
├── package.json             new dependency set
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── CONTRIBUTING.md
└── COLLAB_SETUP_TODO.md     (retain — collab workflow setup notes)
```

### 5.2 Routing — Next.js → Expo Router

| Next.js path | Expo Router path | Notes |
|---|---|---|
| `src/app/layout.tsx` | `app/_layout.tsx` | Root layout, fonts, GA on web only |
| `src/app/page.tsx` | `app/index.tsx` | Home |
| `src/app/results/page.tsx` | `app/results.tsx` | Calls `/api/search` (was inline pipeline) |
| `src/app/saved/page.tsx` | `app/saved.tsx` | |
| `src/app/about/page.tsx` | `app/about.tsx` | (and contact / privacy / terms) |
| `src/app/api/parse-trip/route.ts` | `app/api/parse-trip+api.ts` | |
| `src/app/api/places-autocomplete/route.ts` | `app/api/places-autocomplete+api.ts` | |
| `src/app/api/search/route.ts` | `app/api/search+api.ts` | Becomes thin handler over `searchTrip()` |
| `proxy.ts` (Next.js middleware) | (deleted) | Web SSR cookie auth re-introduced when sign-in lands |

### 5.3 Web rendering mode

Expo Router's `web.output` is a **global** app setting (not per-route).
Because API routes live inside the Expo tree, the app must use
`web.output: "server"`.

Trade-off: marketing/legal pages (home, about, privacy, terms) get
server-rendered instead of statically built. SEO is preserved (real
HTML is returned per request), at a small cold-start latency cost on
Netlify Functions.

### 5.4 Server-secret boundary

**Rule:** Universal code (`app/**`, `src/components/**`, `src/lib/**`,
`src/client/**`) MUST NOT import from `src/server/**`. Only
`app/api/**+api.ts` files may.

Enforcement:

- Directory naming convention (`src/server/`) makes violations obvious
  in review.
- ESLint rule (`no-restricted-imports`) blocks `src/server/**` imports
  from anywhere except `app/api/**`.
- CI lint job catches violations.

This prevents Anthropic / Apify / SERP / Google Places keys from
entering the client bundle on either web or native.

### 5.5 `/results` pipeline extraction

Today, `src/app/results/page.tsx` is an async Next Server Component
that imports server-only code (`serpapi`, `geocode`,
`listing-provider`, `vibe`) and runs the full search pipeline inline.
The current `/api/search` route does **less** than this page (raw
`searchListings()` output, no budget/vibe/geocoding).

**Refactor:** extract a single server-only entry point:

```ts
// src/server/search/pipeline.ts
export async function searchTrip(input: TripInput): Promise<{
  matched: Listing[];
  overflow: Listing[];
  metadata: SearchMetadata;
  errors: string[];
}>;
```

`app/api/search+api.ts` becomes a thin handler that validates input
with zod and calls `searchTrip()`. Both web and native `app/results.tsx`
call `/api/search` through `src/client/search.ts`.

This unblocks native (which cannot import server code) and removes the
current divergence between `/results` and `/api/search`.

### 5.6 Supabase universal client

```
src/lib/supabase.ts
  ↓
createClient({ url, anonKey, storage: kvStore })
  ↓
@supabase/supabase-js
```

- `@supabase/ssr` dropped.
- `src/lib/kv-store.ts` exports a storage adapter implementing the
  Supabase `SupportedStorage` interface, backed by:
  - native: `@react-native-async-storage/async-storage`
  - web: `localStorage`
- The factory accepts a storage adapter, so a future `cookieStorage`
  adapter can be added for web SSR cookie auth when sign-in lands
  without changing call sites.
- No auth UI ships in this branch. The spike (see §8) verifies
  initialization and `auth.getSession()` round-trip only.

### 5.7 `lib/saved.ts` swap

Same public API (`isSaved`, `saveListing`, `unsaveListing`,
`toggleSaved`, `getSavedListings`, `subscribeSaved`,
`getSavedCount`). Internally swaps raw `localStorage` for
`kvStore`. `useSyncExternalStore` pattern is preserved.

Behavior remains per-device (no cross-device sync). Migration to
per-user Supabase rows is a post-port branch concern.

### 5.8 UI rewrite scope (DOM → React Native primitives)

The Next.js codebase is DOM-first:

- Elements: `<main>`, `<form>`, `<input>`, `<textarea>`, `<button>`,
  `<a>`, `<img>`, `<h1>`–`<h6>`, `<p>`, `<div>`, `<span>`, `<section>`
- Next imports: `next/link`, `next/navigation`, `next/font`,
  `next/script`, `Metadata` type
- DOM APIs: browser date inputs, form `onSubmit`,
  `document.addEventListener`, `MouseEvent`, `localStorage`
- Tailwind web-only utilities: `grid`, `hover:`, `sm:`, `group`,
  `object-cover`, HTML layout assumptions

NativeWind does NOT make HTML elements work on iOS. Every component
needs a rewrite to RN primitives. The "Tailwind class translation"
benefit applies to layout/spacing/color classes — markup itself is
rewritten.

| DOM | RN |
|---|---|
| `<div>` | `<View>` |
| `<p>`, `<span>`, `<h1..6>` | `<Text>` |
| `<button>` | `<Pressable>` |
| `<a href>` | `<Link href>` (`expo-router`) |
| `<img src>` | `<Image>` (`expo-image`) |
| `<input>` | `<TextInput>` |
| `<textarea>` | `<TextInput multiline>` |
| `<form onSubmit>` | controlled inputs + button handler |
| `<input type="date">` | native date picker (`@react-native-community/datetimepicker`) on native, `<input type="date">` on web via platform-split component |
| scrolling container | `<ScrollView>` or `<FlatList>` |
| `useRouter()` (Next) | `useRouter()` (`expo-router`) |
| Top-level metadata export | `<Head>` from `expo-router` |

Each component is treated as a rewrite, not a rename:

- `components/trip-form.tsx`
- `components/place-autocomplete.tsx`
- `components/listing-card.tsx`
- `components/save-button.tsx`
- `components/sortable-listings.tsx`

Safe areas, keyboard avoidance, and platform-conditional pickers are
addressed per component.

### 5.9 Environment variables

| Current (Next) | New (Expo) | Visibility |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `EXPO_PUBLIC_SUPABASE_URL` | client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | client |
| `SUPABASE_SERVICE_ROLE_KEY` | (same) | server only |
| `ANTHROPIC_API_KEY` | (same) | server only |
| `APIFY_TOKEN` | (same) | server only |
| `SERPAPI_KEY` | (same) | server only |
| `GOOGLE_PLACES_API_KEY` | (same) | server only |

`.env.local.example` updated. `next.config.ts` `env` block (which
currently re-exports `SERPAPI_KEY` and `GOOGLE_PLACES_API_KEY` through
public bundle — a leak risk) is deleted; secrets only exist in
`process.env` inside `+api.ts` handlers.

### 5.10 Layout / fonts / analytics

- **Fonts:** `expo-font` loads Geist/Geist Mono from
  `assets/fonts/` on native; web branch uses `<link>` to Google
  Fonts in the document head (Expo Router web supports custom HTML
  head via `app/+html.tsx`).
- **Google Analytics:** web-only. Loaded via `app/+html.tsx` `<script>`
  tags (same `G-J7ZYR8D7LY` id). No GA on native in this branch.
- **Footer:** ports to a shared `Footer` RN component used inside
  `_layout.tsx`. Affiliate disclosure text preserved. `[SITE NAME]`
  placeholder retained (out of scope).

### 5.11 Netlify deployment

- Adapter: `expo-server/adapter/netlify` (third-party; alpha-grade).
- `netlify.toml` rewritten:
  - `command = "npx expo export --platform web"`
  - `publish = "dist/client"`
  - `included_files = ["dist/server/**/*"]`
  - redirects route `/*` → `/.netlify/functions/server`
- Remove `@netlify/plugin-nextjs`.

This is the **branch-killer risk**. If the adapter does not work for
this app, the entire "delete Next.js" decision must be revisited.
Hence it is Spike #1 (§8).

### 5.12 Android compatibility

`app.json` declares `ios` and `android` sections (bundle IDs, icons,
splash). Android builds via `npx expo run:android` but is not part of
acceptance criteria. Any iOS-specific code is gated behind
`Platform.OS === 'ios'` rather than assumed.

## 6. Acceptance criteria

### 6.1 Build & deploy

- [ ] `npm install` clean from lockfile
- [ ] `npx expo export --platform web` produces `dist/`
- [ ] Netlify build succeeds against the Expo adapter
- [ ] Production web URL loads home page
- [ ] Production web URL serves `/api/parse-trip`, `/api/search`,
      `/api/places-autocomplete`

### 6.2 Web functional parity

- [ ] All seven pages render: `/`, `/results`, `/saved`, `/about`,
      `/contact`, `/privacy`, `/terms`
- [ ] Trip form submits and lands on `/results` with query params
- [ ] `/results` calls `/api/search` and displays listings
- [ ] Save / unsave from `/results` persists across reload (localStorage)
- [ ] `/saved` reflects saved listings
- [ ] Places autocomplete works on the home form

### 6.3 SEO parity (narrow definition)

For `/`, `/about`, `/privacy`, `/terms`:

- [ ] `curl <url>` returns HTML containing the page `<title>` and a
      meaningful `<meta name="description">`
- [ ] `curl <url>` returns HTML containing visible body copy (not just
      an empty `<div id="root">`)

`/results` and `/saved` are explicitly excluded from SEO criteria — they
are user-experience pages, not indexable destinations.

### 6.4 Native (handoff to MBP)

- [ ] `npx expo start` then `i` launches iOS sim
- [ ] Home screen renders
- [ ] Trip form submits (text inputs, date picker, location
      autocomplete)
- [ ] `/results` fetches and renders listings via `/api/search`
- [ ] Save / unsave works; persists across app relaunch
- [ ] `/saved` shows saved listings
- [ ] No console errors of severity `error` on either iOS or web
- [ ] `npx expo run:android` builds without errors (smoke only)

### 6.5 Code-quality gates

- [ ] CI lint, typecheck, test, build all green
- [ ] ESLint rule blocks `src/server/**` imports from universal code
- [ ] `budget.test.ts` still passes (Vitest)
- [ ] No `NEXT_PUBLIC_*` references remain in source

## 7. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R1 | Expo Router `server` output on Netlify (alpha adapter) fails for this app | Medium | Branch dies | Spike #1 — gate Next.js deletion on green Netlify deploy |
| R2 | NativeWind v4 + Tailwind v4 build config breaks on Metro | Medium | Need fallback | Spike #3 — fall back to Tailwind 3.4 + NativeWind v4 if v4+v4 unworkable |
| R3 | UI rewrite balloons (every DOM-shaped component is a rewrite) | High | Schedule slip | Inventory components up front; bisectable per-component commits |
| R4 | `/results` pipeline extraction has hidden coupling | Medium | Refactor regression | Spike #2 — extract behind tests-by-curl before deleting the inline path |
| R5 | Server secrets leak into client bundle | Low | Security | `src/server/**` boundary + ESLint rule + manual bundle inspection |
| R6 | Native API fetch fails outside dev (origin handling) | Low | MBP confusion | Document explicitly in `docs/mobile-handoff.md` |
| R7 | paper.design → NativeWind translation lossy | Medium | Slower component work | Validate one component as part of Spike #3; document the agent prompt template |
| R8 | SSR cookie auth gone after deleting `proxy.ts` | Low (now) | Blocks future sign-in branch | Spec already calls out: `cookieStorage` adapter and `app/+middleware.ts` re-introduction when auth lands |
| R9 | Long-lived branch diverges from `main` | Medium | Merge pain | Bisectable commits; rebase on `main` at each checkpoint |
| R10 | Cofounder cannot review a single huge PR | Medium | Bottleneck | Commit-per-checkpoint history; PR description maps commits to acceptance criteria |

## 8. Spikes (front-loaded, in order)

Each spike either passes (proceed) or fails (revisit the spec before
continuing). Spike results land as their own commits.

### Spike 1 — Netlify deployability

Empty Expo Router app + one `/api/health` route. Deploys to a Netlify
preview using the `expo-server/adapter/netlify`. Curl
`https://<preview>.netlify.app/api/health` returns `{ ok: true }`.

**Failure fallback:** revisit decision to delete Next.js. Options:
keep Next.js for web + add Expo for native only (degrades the
"universal" choice to "two apps, shared lib").

### Spike 2 — `searchTrip()` extraction

Without Expo work, refactor the current Next.js codebase to introduce
`src/server/search/pipeline.ts` and have BOTH the current
`/api/search` route AND `src/app/results/page.tsx` call it.

Tests-by-curl: same trip input produces the same listings via
`/results` and `/api/search`. This commit can ship to `main`
independently of the Expo port if needed.

### Spike 3 — NativeWind v4 + Tailwind v4 + one real component

Port `trip-form` (smallest non-trivial component) to RN + NativeWind
inside the Expo skeleton from Spike 1. Validate on web and (eventually)
iOS. Run a paper.design export through this agent to confirm the
translation pipeline.

**Failure fallback:** drop to Tailwind 3.4 + NativeWind v4.

### Spike 4 — Supabase universal client on iOS

`createClient` with AsyncStorage on iOS sim; call `auth.getSession()`
and confirm it returns `null` cleanly (no UI, just foundation).

### Spike 5 — iOS sim smoke (MBP handoff)

After Spikes 1–4 are green and ported screens exist, hand off to Claude
on MBP with `docs/mobile-handoff.md` to execute the §6.4 checklist.

## 9. Commit checkpoints (within the single branch)

Even though the branch merges as one PR (per the user's scope
decision), commits are structured for bisectability and review:

1. Spec lands (this file)
2. Spike 1 result — Netlify + empty Expo app
3. Spike 2 result — `searchTrip()` extracted (could land to `main`
   separately)
4. Spike 3 result — NativeWind config + `trip-form` ported
5. Spike 4 result — Supabase universal client + iOS-sim smoke
6. Per-page port commits (one commit per page: `index`, `results`,
   `saved`, `about`, `contact`, `privacy`, `terms`)
7. Per-API-route port commits (3 commits)
8. `src/server/**` boundary + ESLint rule
9. Layout / fonts / GA / footer port
10. `proxy.ts` and supporting Next.js files deleted
11. `netlify.toml` rewrite
12. `next.config.ts`, `next-env.d.ts`, `postcss.config.mjs`,
    `@next/*` deps removed
13. README / AGENTS / CONTRIBUTING updated
14. `docs/mobile-handoff.md` finalized

## 10. Files deleted

- `src/app/` (entire tree, replaced by `app/`)
- `proxy.ts`
- `src/lib/supabase/proxy.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts` (replaced by `src/lib/supabase.ts`)
- `next.config.ts`
- `next-env.d.ts`
- `postcss.config.mjs`
- `tsconfig.tsbuildinfo`
- `.next/` (already gitignored)
- Dependencies: `next`, `eslint-config-next`, `@supabase/ssr`,
  `@tailwindcss/postcss`

## 11. Post-port roadmap (out of scope, informs design)

The port should not block, and ideally accelerates, the following
post-port branches:

- **Sign-in / auth UI** — uses the universal Supabase client
  established here; re-introduces web SSR cookie auth via
  `app/+middleware.ts` and a `cookieStorage` adapter.
- **Group collaboration** — shared trip records (Supabase Realtime),
  per-user saved listings (`saved.ts` swap from `kvStore` to
  Supabase rows), invite deep-links (`tripplanner://` scheme
  reserved in `app.json`), member presence indicators.
- **EAS Build / TestFlight / Play Internal** — separate branch once
  Apple/Google developer accounts are in place.
- **Push notifications** — `expo-notifications` for trip-update
  alerts; requires EAS.
- **Product name + branding sweep** — replaces `[SITE NAME]`
  placeholder.

## 12. Open questions

None blocking. The following are tracked for the implementation plan:

- Exact Expo SDK version (latest stable at start of implementation).
- Whether to vendor Geist fonts (download to `assets/fonts/`) or use
  Expo Google Fonts package.
- Whether `app/+html.tsx` is the right injection point for GA in the
  current Expo Router version (verify in Spike 1).
