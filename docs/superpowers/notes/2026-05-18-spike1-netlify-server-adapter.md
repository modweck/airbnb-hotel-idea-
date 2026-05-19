# Spike 1 — Expo server adapter on Netlify (partial result)

**Status:** Local build smoke ✅. Netlify deploy verification ⏳ (blocked on
WSL — needs to be run from the MacBook Pro with `netlify` CLI logged in).

**Date:** 2026-05-19

## What was verified on WSL

`spike/netlify-probe/` was scaffolded with:

```bash
cd spike
npx create-expo-app@latest netlify-probe --template tabs
cd netlify-probe
# edit app.json → expo.web.output = "server"
npm install expo-server
# write app/api/health+api.ts, netlify.toml, netlify/functions/server.ts
npx expo export --platform web
```

The export produced both `dist/client/` and `dist/server/` directories
and the API route was bundled:

```
› web bundles (1):
  _expo/static/js/web/entry-<hash>.js (1.79 MB)
› Static routes (5):
  /modal, /_sitemap, /+not-found, /(tabs)/two, /(tabs)
› API routes (1):
  /api/health (3.92 kB)
Exported: dist
```

`dist/server/_expo/functions/api/health+api.js` is the bundled handler.

## Working versions (lock these in for the real port)

From `spike/netlify-probe/package.json`:

```
expo:           ~54.0.33
expo-router:    ~6.0.23
expo-server:    ^55.0.10   ← note major mismatch with expo, see below
react-native:   0.81.5
react-native-web: ~0.21.0
```

**Version-mismatch caveat:** `expo-server@55` is one major ahead of
`expo@54`. The local export still works. If the Netlify-side deploy
fails, try pinning `expo-server` to a `54.x` line or upgrading `expo` to
`55` once it's stable. Document the working pair in this file once
verified on Netlify.

## Working `netlify.toml`

```toml
[build]
  command = "npx expo export --platform web"
  publish = "dist/client"
  functions = "netlify/functions"

[functions]
  included_files = ["dist/server/**/*"]

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
```

## Working `netlify/functions/server.ts`

```ts
import { createRequestHandler } from "expo-server/adapter/netlify";
export default createRequestHandler({ build: "./dist/server" });
```

## WSL constraint — why deploy isn't done here

Netlify deploy requires `netlify` CLI auth (`netlify login` opens a
browser handshake). The WSL session for this work doesn't have that
auth wired up and the user is asleep. Step 6 of the plan is deferred to
the MBP-side follow-up:

```bash
cd spike/netlify-probe
netlify deploy --build
# expect a preview URL
curl https://<preview>.netlify.app/api/health
# expect: {"status":"ok","ts":1747...}
```

## Decision gate (Phase 1 Step 7)

**Local build:** PASS — gate not closed yet but the most likely failure
mode (Metro can't bundle the server output at all) is ruled out.

**Remaining risk:** the Netlify Function may 404, time out, or fail to
find `dist/server/**` at runtime. This is what the MBP deploy resolves.

## Next action (user, on MBP)

1. `git fetch && git checkout feat/expo-port && git pull`
2. `cd spike/netlify-probe && npm install`
3. `netlify login` (one-time)
4. `netlify deploy --build`
5. `curl https://<preview>/api/health` → expect `{"status":"ok",...}`
6. If PASS: update this doc with the deploy URL + close issue #5.
7. If FAIL: capture stack trace here, then revisit the spec (likely
   flip web to `output: "static"` + ship API as separate Netlify
   Functions repo, per spec §"branch-killer").

`spike/` is gitignored so this scratch project never lands on `main`.
