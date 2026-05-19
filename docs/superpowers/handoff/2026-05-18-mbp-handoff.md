# MBP Handoff — Expo Router port (branch `feat/ios-mobile-port`)

## TL;DR

Web port is **functionally complete**. Netlify is deployed
(`trip-planner-expo-test.netlify.app`). All components and pages are
ported to React Native. Remaining work: Phase 11 (delete Next.js) and
Phase 14 (iOS simulator smoke on MBP). The branch builds clean on web —
the iOS sim is the gate to mainline.

**Plan:** `docs/superpowers/plans/2026-05-18-expo-router-port.md`
**Branch:** `feat/ios-mobile-port` (well ahead of `main`)
**Open PRs:** #33 (`chore/sprint-board-setup` → main — cofounder doc only)

## Setup on MBP

```bash
git fetch origin
git switch feat/ios-mobile-port
git pull
nvm use 20            # repo expects Node 20
npm install
cp .env.local.example .env.local
# Fill in EXPO_PUBLIC_SUPABASE_*, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
# SERPAPI_KEY, GOOGLE_PLACES_API_KEY. EXPO_PUBLIC_API_BASE_URL should point to
# the deployed Netlify origin (needed for native builds to reach /api/*).
```

## What's already done (no need to redo)

| Phase | Status | Notes |
|------|--------|-------|
| 1 — Spike 1 (Netlify server adapter) | **Done** | Deployed to `https://trip-planner-expo-test.netlify.app` on 2026-05-19 (ikkidev personal). `/api/health` 200, SSR works. See `docs/superpowers/notes/2026-05-18-spike1-netlify-server-adapter.md` + `docs/modweck-netlify-handoff.md`. |
| 2 — `searchTrip()` extraction | Done | `src/server/search/pipeline.ts` + Vitest tests. |
| 3.1 — Expo Router scaffold | Done | NativeWind 4 + Tailwind v3 + react-native-css-interop. `app.json` `extra.router.root = "./app"` (critical). |
| 3.2 — Port `trip-form.tsx` | **Done** | Ported on MBP, then split on WSL into `src/components/trip-form/{index,use-trip-form,shared,ai-parser,where-when,who-budget,hotel-specifics,priority-vibe,advanced-filters,submit-button}.tsx`. |
| 4 — Supabase + kvStore | Done | `src/lib/kv-store.{ts,web,native}.ts`, `src/lib/supabase.ts`. |
| 5 — ESLint server boundary | Done | `eslint.config.mjs`. |
| 6 — API routes ported | Done | `app/api/{health,search,parse-trip,places-autocomplete}+api.ts`. |
| 7 — Universal client wrappers | Done | `src/client/{_base,trip,search,places}.ts`. |
| 8 — Shared helpers | Done | `saved.ts` → kvStore. Analytics already guarded by `typeof window`. |
| 9 — Component ports | **Done** | `place-autocomplete`, `listing-card`, `save-button`, `sortable-listings`, and the trip-form bundle are all RN. |
| 10 — Top-level pages | **Done** | `app/index.tsx` (home with hero + form), `app/results.tsx` (client-side `searchTripApi`), `app/saved.tsx` (`useSyncExternalStore`), and `app/{about,contact,privacy,terms}.tsx`. |
| 11 — Delete Next | **Not started** | Wait until iOS sim confirms the port doesn't regress on native — see priority 2 below. |
| 12 — Web build verification | **Done** | `ci.yml` (lint/typecheck/test/expo export) and `release.yml` (verify → Netlify build hook → GitHub Release) both Expo-shaped with no Next references. Netlify preview deploy verified. |
| 13 — Lint & types | Done | tsc + eslint + Vitest all green. |
| 14 — Native build smoke | **Not started** | iOS sim + EAS Build. **This is the main MBP task.** |

## What works today

- `npm test` → 65/65 Vitest green
- `npx tsc --noEmit` → clean
- `npm run lint` → clean
- `npx expo export --platform web` → 9 static routes (`/`, `/results`, `/saved`, `/about`, `/contact`, `/privacy`, `/terms`, `/_sitemap`, `/+not-found`) + 4 API routes (`/api/{health,search,parse-trip,places-autocomplete}`)
- Netlify production deploy: `https://trip-planner-expo-test.netlify.app`

## What's broken (expected, will be fixed in Phase 11)

- `npm run dev` (Next) — Tailwind was downgraded v4→v3 for NativeWind compat,
  but `@tailwindcss/postcss` is still v4. Acceptable per plan; Next gets
  deleted in Phase 11.
- `npm run build` (Next) — same reason.

If you need to test something in Next during the migration, restore Tailwind
v4 in a throwaway branch — don't bother fixing on `feat/ios-mobile-port`.

## Priority order on MBP

### 1. iOS simulator smoke (Phase 14)

```bash
npx expo start --ios
```

Expected: app boots, lands on `/`, renders the hero + trip form. Navigate
to `/saved`, `/about`, `/privacy`, `/terms`, `/contact` via the URL bar /
internal links. Submit the form → `/results?...` should fetch
`/api/search` and render listings (the form's `Saved` link goes to
`/saved`).

If the simulator fails to launch:
- Check `app.json` `extra.router.root` is `"./app"` (the knob)
- Check `package.json` `main` is `"expo-router/entry"`
- Confirm `react-native-css-interop` is in `dependencies` (not just transitive)
- The static pages use Unicode bullets (`\u2022`) instead of `<ul>` — confirm
  they render correctly on iOS (Text inside View, no nested-text RN warning).

### 2. Phase 11 — Delete Next.js

Only after the iOS sim smoke passes. Files to remove:

```bash
git rm -r src/app next.config.ts next-env.d.ts postcss.config.mjs
```

Then drop Next-only deps from `package.json`:

```bash
npm uninstall next eslint-config-next @tailwindcss/postcss
```

And update `package.json` scripts to remove `dev`/`build` (Next) — replace
with `expo start` / `expo export --platform web`.

Verification loop:

```bash
npm install
npx tsc --noEmit && npm test && npm run lint
rm -rf dist && npx expo export --platform web
```

### 3. Optional polish (low priority, not blocking mainline)

- **Footer in `app/_layout.tsx`** — the legacy `src/app/layout.tsx` had a
  footer linking to /privacy /terms /contact /about /saved + affiliate
  disclaimer + copyright. The new layout has only `<Stack/>`. Pages are
  reachable by URL but not surfaced in the UI. On mobile, prefer a drawer
  / hamburger menu over a web footer.
- **Fonts (Phase 10.1 step 1)** — Geist family not yet loaded. System font
  fallback is fine for the smoke; wire `expo-font` when you want pixel
  parity with the deployed site.
- **`app/+html.tsx`** — for GA + viewport meta on web. Plan §10.1 step 2.

## Things to be aware of

- **gh CLI auth quirk:** `gh` defaults to `GITHUB_TOKEN` (Intelerad). For
  personal-repo work, use:
  ```bash
  unset GITHUB_TOKEN; export GH_CONFIG_DIR=~/.config/gh-personal
  ```

- **Project board:** https://github.com/users/ikkidev/projects/1 — sprint
  board with 28 issues. Owner is `ikkidev`. The board is **not** linked to
  the repo (different owners — modweck owns the repo). modweck has to link
  from his side via the repo Projects UI.

- **PR #33** (cofounder onboarding doc) is open against `main`. Can be merged
  any time. Independent of the Expo work.

- **Commit conventions for this repo:** single-line subject, NO body, NO
  Co-authored-by trailer, NO Jira prefix. This is the personal-repo override
  in `~/.copilot/CLAUDE.md`.

- **Cofounder lane:** modweck (sales background, beginner, vibe-codes) owns
  `src/lib/*.ts` additive utilities + research/marketing. Don't let him into
  `src/server/`, `app/api/`, or anything in `src/client/`. See
  `docs/cofounder-onboarding.md` for the working agreement.

- **`tsconfig.json` excludes `src/app`** — legacy Next pages don't block
  tsc/test/build, so the cutover in Phase 11 is purely cosmetic for build
  output. But the old pages still get bundled if anything imports from
  them; grep before deleting.

- **`searchTripApi()` on the client** imports `SearchTripInput` /
  `SearchTripResult` from `@/server/search/pipeline` as `import type` only
  (erased at runtime). The ESLint server boundary lets this through because
  it's type-only.

## Files most likely to need attention

| File | Why |
|------|-----|
| `app.json` | `extra.router.root` MUST stay `"./app"` or Expo picks `src/app/`. |
| `eslint.config.mjs` | Server-only boundary — add new server paths here as you create more `app/api/**+api.ts` files. |
| `src/lib/supabase.ts` | Universal client. Throws at import time if env vars missing — make sure they're set before `npx expo start`. |
| `tailwind.config.js` | v3 syntax. Do NOT bump to v4 until NativeWind 5 ships. |
| `vitest.config.ts` | env=node by default. Web tests need `// @vitest-environment jsdom` pragma. |
| `app/_layout.tsx` | Bare `<Stack/>` for now. Footer + fonts + `+html.tsx` are open items. |

## Open questions for Ikki

- Should we keep Apify / SerpAPI on the server in `app/api/+api.ts`, or push
  to a separate Netlify Function for cold-start tuning? Plan says inline for
  now; revisit after Phase 14 if cold starts are bad.
- Sign-in: not yet implemented anywhere. Supabase client is set up for it;
  the sign-in screen itself is a follow-up project after the port lands.
  Target audience is group travelers — sign-in should support shared trip
  collaboration (this is the mockup ikki is bringing on a separate branch).
- Mobile navigation: pages exist but only the home page and form-embedded
  `Saved` link surface them. Pick a navigation pattern (drawer, tab bar,
  hamburger) before the iOS smoke if you want a richer demo.
