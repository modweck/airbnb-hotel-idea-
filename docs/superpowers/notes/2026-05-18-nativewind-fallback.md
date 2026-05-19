# NativeWind / Tailwind / Expo Router scaffold fallback (Phase 3.1 — RESOLVED)

**Status:** All 3 blockers resolved. `npx expo export --platform web`
succeeds at repo root, producing `dist/client/` + `dist/server/` with
the placeholder Expo route rendered and a 19 KB NativeWind CSS bundle.

**Date:** 2026-05-19 (resolved same day)

## Final working setup

### Versions

```
expo                       ^55.0.25
expo-router                ^55.0.15
expo-server                ^55.0.10
react-native               ^0.85.3
react-native-web           ^0.21.2
react-native-css-interop   ^0.2.4   ← had to be installed at root explicitly
nativewind                 ^4.2.4
tailwindcss                ^3.4.19  ← downgraded from v4; NativeWind 4 only supports v3
```

### Required `app.json` knob

To stop Expo Router from picking `src/app/` (Next's dir) over the root
`app/`, set this in `app.json`:

```json
{
  "expo": {
    "extra": {
      "router": { "root": "./app" }
    }
  }
}
```

The env var `EXPO_ROUTER_APP_ROOT` is only consumed by the dev-time
Tutorial component, not by routing. Source:
`node_modules/expo/node_modules/@expo/cli/build/src/start/server/metro/router.js:107-117`.

### `package.json` `main` field

```json
"main": "expo-router/entry"
```

Without this, Expo falls back to `expo/AppEntry.js` which expects
`App.tsx` at the root.

## Build output

```
$ npx expo export --platform web
› web bundles (2):
  _expo/static/css/web-<hash>.css (19KB)
  _expo/static/js/web/entry-<hash>.js (1.1MB)
› Static routes (3): / (index), /_sitemap, /+not-found
Exported: dist
```

The SSR'd HTML at `dist/server/index.html` contains:

```html
<div>...Trip planner — Expo port...</div>
```

(text wrapped in react-native-web's generated class names; NativeWind
utilities resolve via the css-interop runtime on hydration.)

## How each blocker was solved

### Blocker 1 — Tailwind v4 ≠ NativeWind v4

`npm install tailwindcss@^3.4`. The repo's `@tailwindcss/postcss@^4`
(Next side) still resides in `node_modules` but is no longer triggered
because Next is no longer the bundler.

### Blocker 2 — Expo Router picks `src/app/` over `app/`

Set `expo.extra.router.root: "./app"` in `app.json` (see above).
Configurable via `getRouterDirectoryModuleIdWithManifest()` in expo
SDK 55.

### Blocker 3 — `react-native-css-interop/jsx-runtime` not resolved

The `@expo/router-server` package is nested under
`expo/node_modules/@expo/cli/node_modules/` and its module resolution
doesn't walk far enough up to find `react-native-css-interop` if it's
only installed transitively. Solution: install at root:

```bash
npm install react-native-css-interop
```

## State of co-existence with Next.js on `feat/expo-port`

| Tool | Works? | Notes |
|------|--------|-------|
| `npm test` (Vitest) | ✅ | 23 tests green |
| `npx tsc --noEmit` | ✅ | `spike/`, `dist/`, `.expo/` excluded |
| `npm run lint` | ✅ | `spike/`, `dist/`, root CJS configs ignored |
| `npx expo export --platform web` | ✅ | Phase 3.1 working |
| `npm run dev` (Next dev) | ❌ | Tailwind v3 mismatch with @tailwindcss/postcss v4. Acceptable — Next dies in Phase 11. |
| `npm run build` (Next build) | ❌ | Same reason. |

This is the expected mid-port state during the Next → Expo co-existence
window.

## Spike directory

`spike/netlify-probe/` is a standalone Expo SDK 54 project (predating
the root-level scaffold which is on SDK 55). Both setups now work; keep
the spike around as the "proven Netlify deploy" reference for the
eventual MBP follow-up on Phase 1.

## Next action

Proceed to Phase 4 (Supabase universal client + `kvStore`).
Phase 3.2 (port `trip-form.tsx`) is deferred until UI verification on
a real browser is possible — too risky to do without screenshots.
