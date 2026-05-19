# Netlify + Supabase setup for modweck

When `feat/ios-mobile-port` merges to `main`, the Netlify site connected
to this GitHub repo (yours, modweck) will try to build the new Expo
config and **fail without these env vars and one extra flag**. This
doc is the runbook so the first deploy after merge just works.

Verified working on ikkidev's personal Netlify site
(`https://trip-planner-expo-test.netlify.app`) on 2026-05-19. Same
config should work on yours.

## What changed in the repo

| File | Change |
|------|--------|
| `netlify.toml` | Was: Next.js + `@netlify/plugin-nextjs`. Now: `npx expo export --platform web`, publishes `dist/client`, functions in `netlify/functions`, redirects all routes to one server function. |
| `netlify/functions/server.ts` | New 2-line file: `expo-server/adapter/netlify` adapter that handles SSR + all `/api/*` routes. |

## One non-obvious gotcha

Netlify auto-detects Next.js from `next.config.ts` and auto-installs
`@netlify/plugin-nextjs`, which then errors because there's no `.next/`
output. **You MUST set this env var on your Netlify site** before the
first deploy:

```
NETLIFY_NEXT_PLUGIN_SKIP = true
```

This goes away in Phase 11 when `next.config.ts` and the rest of the
Next.js layer are deleted from the repo.

## Required env vars on your Netlify site

Set all of these (Site settings → Environment variables → Add a
variable, scope = All scopes). Mark the ones flagged "secret" with the
"Contains secret values" checkbox.

| Variable | Source | Secret? |
|---|---|---|
| `NETLIFY_NEXT_PLUGIN_SKIP` | Literal value: `true` | No |
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project: Settings → API → Project URL | No |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase project: Settings → API → Publishable key (or legacy `anon`) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase project: Settings → API → Secret key (or legacy `service_role`) | **Yes** |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com → API Keys | **Yes** |
| `SERPAPI_KEY` | https://serpapi.com → Manage API Key | **Yes** |
| `GOOGLE_PLACES_API_KEY` | https://console.cloud.google.com → APIs → Credentials (enable "Places API (New)" first) | **Yes** |
| `APIFY_TOKEN` (optional) | https://console.apify.com/account/integrations | **Yes** |

**Important — Supabase keys:** Supabase is migrating from legacy `anon`
/ `service_role` JWTs to new `sb_publishable_...` / `sb_secret_...`
keys. Either format works with `@supabase/supabase-js` — pick the new
ones if your project shows both. Env-var **names** stay the same
(`EXPO_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) so we
don't have to touch code.

**Important — `EXPO_PUBLIC_SUPABASE_ANON_KEY` is NOT actually secret.**
It's designed to ship in the browser bundle; Row-Level Security
protects writes. Leaving the "Contains secret values" checkbox
unchecked is fine and lets you re-read the value from the UI later.

## Supabase setup (if you don't have a project yet)

If you want to use the same Supabase project as ikki (recommended for
shared dev data during the port), ask ikki to invite you to
`trip-planner-db` via Settings → Organization → Members.

Otherwise, create your own:

1. https://app.supabase.com → New Project → name it, save the DB
   password, pick the closest region, Free plan
2. Wait ~2 min for provisioning
3. **Apply the schema:** in the project, left sidebar → SQL Editor →
   New query → paste the entire contents of `db/schema.sql` from this
   repo → Run
4. Copy the URL + keys from Settings → API into the Netlify env vars
   above

The schema creates 5 tables (`profiles`, `trips`, `listings`,
`saved_listings`, `watch_alerts`) plus Row-Level Security policies.
Today only `supabase.auth.getUser()` is called from the app — the rest
of the tables are scaffolding for upcoming features.

## Verification (after deploy)

Once env vars are set and Netlify rebuilds the site successfully, smoke
test the same 5 endpoints ikki verified:

```bash
SITE="https://<your-site>.netlify.app"

# Should return JSON, HTTP 200
curl -s -w "\n[HTTP %{http_code}]\n" "$SITE/api/health"
# expect: {"status":"ok","ts":...}

# Should return SSR'd HTML containing Expo Router output
curl -sL "$SITE/" | head -c 200

# These need the respective API keys; without them they 500.
# With keys, they return JSON results:
curl -s "$SITE/api/places-autocomplete?q=lisb"
curl -s -X POST "$SITE/api/parse-trip" -H 'content-type: application/json' \
  -d '{"text":"weekend in Lisbon for 2"}'
```

## Still-pending repo hygiene (your side)

Per `COLLAB_SETUP_TODO.md` and issues #30 / #31:

- [ ] Enable branch protection on `main` (require PR review, no direct
      pushes). Blocking proper PR review of this branch.
- [ ] Add `ikkidev` as Write collaborator on the repo. Currently can't
      open PRs against `main` for review without this.

Worth doing before merging this branch so the next ones go through a
proper review gate.
