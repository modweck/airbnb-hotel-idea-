# MBP Handoff — Expo Router port (branch `feat/ios-mobile-port`)

## TL;DR

Everything that can be done on WSL without a UI is done. Branch is pushed and
ready. Pick this up on the MBP, run the iOS simulator + a real Netlify deploy,
finish Phases 1, 3.2, 9–11, 14 of the plan.

**Plan:** `docs/superpowers/plans/2026-05-18-expo-router-port.md`
**Branch:** `feat/ios-mobile-port` (15 commits ahead of `main`)
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
# SERPAPI_KEY, GOOGLE_PLACES_API_KEY. Leave EXPO_PUBLIC_API_BASE_URL until
# Netlify deploy lands (only needed for native builds).
```

## What's already done (no need to redo)

| Phase | Status | Notes |
|------|--------|-------|
| 1 — Spike 1 (Netlify server adapter) | **Done** | Deployed to `https://trip-planner-expo-test.netlify.app` on 2026-05-19 (ikkidev personal). `/api/health` 200, SSR works. See `docs/superpowers/notes/2026-05-18-spike1-netlify-server-adapter.md` for verified versions + the `NETLIFY_NEXT_PLUGIN_SKIP=true` gotcha. `docs/modweck-netlify-handoff.md` is the runbook for modweck's Netlify site. |
| 2 — `searchTrip()` extraction | Done | `src/server/search/pipeline.ts` + 3 Vitest tests. |
| 3.1 — Expo Router scaffold | Done | NativeWind 4 + Tailwind v3 + react-native-css-interop. See `docs/superpowers/notes/2026-05-18-nativewind-fallback.md` for the version matrix + the `app.json` `extra.router.root` knob (critical). |
| 3.2 — Port `trip-form.tsx` | **Skipped** | 37KB UI rewrite. Needs Paper.design screenshots + iOS simulator side-by-side. Do this on MBP. |
| 4 — Supabase + kvStore | Done | `src/lib/kv-store.{ts,web,native}.ts`, `src/lib/supabase.ts`. |
| 5 — ESLint server boundary | Done | `eslint.config.mjs`. |
| 6 — API routes ported | Done | `app/api/{health,search,parse-trip,places-autocomplete}+api.ts`. |
| 7 — Universal client wrappers | Done | `src/client/{_base,trip,search,places}.ts`. |
| 8 — Shared helpers | Done | `saved.ts` → kvStore. Analytics already guarded by `typeof window`. |
| 9 — Component ports | **Not started** | UI work; needs simulator. |
| 10 — Top-level pages | **Not started** | UI work. |
| 11 — Delete Next | **Not started** | Wait until 9+10 land. |
| 12 — Web build verification | **Not started** | `npx expo export` works locally; verify on Netlify. |
| 13 — Lint & types | Done | tsc + eslint green. |
| 14 — Native build smoke | **Not started** | iOS sim + EAS Build. **This is the main MBP task.** |

## What works today

- `npm test` → 26/26 Vitest green
- `npx tsc --noEmit` → clean
- `npm run lint` → clean
- `npx expo export --platform web` → produces `dist/client/` (SSR'd HTML + NativeWind CSS) + `dist/server/` with all 4 API routes bundled

## What's broken (expected, will be fixed in Phase 11)

- `npm run dev` (Next) — Tailwind was downgraded v4→v3 for NativeWind compat,
  but `@tailwindcss/postcss` is still v4. Acceptable per plan; Next gets
  deleted in Phase 11.
- `npm run build` (Next) — same reason.

If you need to test something in Next during the migration, restore Tailwind
v4 in a throwaway branch — don't bother fixing on `feat/ios-mobile-port`.

## Priority order on MBP

### 1. Finish Phase 1 — Netlify deploy

**Spike step skipped — deploy the root app directly.** Local `expo export`
already proved Metro can bundle server output, so the probe adds no value.
The root `netlify.toml` and `netlify/functions/server.ts` are committed
and a clean `npx expo export --platform web` was verified on WSL
(2026-05-19) — produces `dist/client/` + 4 bundled API routes under
`dist/server/_expo/functions/api/`.

```bash
cd /path/to/repo
git switch feat/ios-mobile-port && git pull
nvm use 20 && npm install

netlify login                       # one-time, opens browser
netlify init                        # ikkidev personal account, new site
netlify deploy --build              # preview build on Netlify
curl https://<preview>.netlify.app/api/health
# expect: {"status":"ok","ts":...}

# If preview passes:
netlify deploy --build --prod
```

Capture the production URL and put it in `.env.local` as
`EXPO_PUBLIC_API_BASE_URL` (needed for the native build to reach `/api/*`).

**If the Netlify build fails**, fall back to the spike to isolate
root-app config vs. adapter issues. Recreate it from
`docs/superpowers/notes/2026-05-18-spike1-netlify-server-adapter.md`
(lines 12-20 are the exact scaffold; the working `netlify.toml` and
`netlify/functions/server.ts` are inline in that doc). `spike/` is
gitignored — it never travels between machines.

### 2. iOS simulator smoke (Phase 14 minimal)

```bash
npx expo start --ios
```

Expected: app boots, lands on `/`, displays "Trip planner — Expo port" stub.
Right now `app/index.tsx` is a placeholder — that's fine for the smoke. Real
content comes after Phase 3.2 + 9 + 10.

If the simulator fails to launch:
- Check `app.json` `extra.router.root` is `"./app"` (the knob)
- Check `package.json` `main` is `"expo-router/entry"`
- Confirm `react-native-css-interop` is in `dependencies` (not just transitive)

### 3. Port `trip-form.tsx` (Phase 3.2)

This is the big one. Existing component is `src/components/trip-form.tsx`.
The plan describes the port contract: RN primitives, NativeWind `className`,
`onPress` not `onClick`.

You have Paper.design mockups — open them side-by-side with the simulator.

**Commit one component at a time.** Each commit message should be
`Port <component-name> to React Native` (single-line, no body, no prefix —
personal-repo convention from `~/.copilot/CLAUDE.md`).

### 4. Phase 9, 10, 11, 14 — finish the migration

Follow the plan strictly. The key sequencing rule: don't delete `src/app/`
(Phase 11) until everything in `app/` works on web AND iOS.

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

## Files most likely to need attention

| File | Why |
|------|-----|
| `app.json` | `extra.router.root` MUST stay `"./app"` or Expo picks `src/app/`. |
| `eslint.config.mjs` | Server-only boundary — add new server paths here as you create more `app/api/**+api.ts` files. |
| `src/lib/supabase.ts` | New universal client. Throws at import time if env vars missing — make sure they're set before `npx expo start`. |
| `tailwind.config.js` | v3 syntax. Do NOT bump to v4 until NativeWind 5 ships. |
| `vitest.config.ts` | env=node by default. Web tests need `// @vitest-environment jsdom` pragma. |

## Open questions for Ikki

- Should we keep Apify / SerpAPI on the server in `app/api/+api.ts`, or push
  to a separate Netlify Function for cold-start tuning? Plan says inline for
  now; revisit after Phase 14 if cold starts are bad.
- Sign-in: not yet implemented anywhere. Supabase client is set up for it;
  the sign-in screen itself is a follow-up project after the port lands.
  Target audience is group travelers — sign-in should support shared trip
  collaboration (this is the mockup ikki is bringing on a separate branch).
