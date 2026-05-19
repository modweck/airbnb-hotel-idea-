# Mobile validation handoff (iOS, MacBook Pro)

This codebase is developed primarily on WSL where iOS validation is not
possible. Use this checklist on a MacBook Pro to smoke-test the iOS
build before merging branches to `main`.

For full project context, including the staged Expo Router port history
and Netlify deploy notes, see
[`docs/superpowers/handoff/2026-05-18-mbp-handoff.md`](./superpowers/handoff/2026-05-18-mbp-handoff.md).

## Setup

1. `git fetch && git switch <branch> && git pull`
2. `nvm use 20` (Node 20+)
3. `npm install`
4. Copy `.env.local.example` to `.env.local` and fill in `EXPO_PUBLIC_SUPABASE_*`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `SERPAPI_KEY`,
   `GOOGLE_PLACES_API_KEY`. Set `EXPO_PUBLIC_API_BASE_URL` to the deployed
   Netlify origin so the native build can reach `/api/*`.
5. Install Xcode if not present; run `xcode-select --install`.
6. `brew install watchman`.
7. `npm run ios` → opens the iOS simulator.

## Smoke checklist

- [ ] App boots in iOS simulator, no red-screen errors
- [ ] Home renders hero + trip form, fonts load (or system fallback)
- [ ] Place autocomplete: typing `Lis` shows suggestions from Google Places
- [ ] AI parse: typing free-text into the parser populates the form
- [ ] Submit form → `/results` loads via `searchTripApi` → listings render
- [ ] Tap a listing's save heart → state toggles → kill + relaunch app → still saved (AsyncStorage)
- [ ] `/saved` page lists the saved listing; tapping Remove unsaves it
- [ ] Tap a listing card → opens external booking URL in Safari
- [ ] Sort pills change order on `/results`
- [ ] Static pages (`/about`, `/contact`, `/privacy`, `/terms`) render
- [ ] No console errors in Metro logs (warnings okay)

## Known limitations (out of scope)

- No sign-in UI yet (Supabase client wired; screen is a follow-up)
- No push notifications, no deep links beyond default Expo Router scheme
- Android only verified to build; not visually QA'd
- No tab bar / drawer — static pages reachable only by URL on web

## If something fails

Open a comment on the relevant PR with:

- Exact step that failed
- Metro log excerpt
- Screenshot of the simulator
- Output of `npx expo-doctor`
