# Trip Planner — best bang for your buck

AI trip planner that finds the 3–5 best stays for your group across VRBO, Booking.com, and more — ranked by real value, not just price.

Not another search engine. A **decision engine**.

## Stack

- **Expo SDK 55** + Expo Router (universal iOS / Android / web from one tree)
- **React Native** + react-native-web, **NativeWind 4** on **Tailwind v3**
- **TypeScript**, **Vitest** for pure-logic tests
- **Supabase** — Postgres + auth (universal client via `src/lib/supabase.ts`)
- **Apify** + **SerpAPI** — VRBO / Booking.com scrapers and search providers
- **Anthropic Claude** — natural-language trip parsing on `/api/parse-trip`
- **Netlify** + `expo-server/adapter/netlify` for the web build; native runs in
  Expo Go (sim) and EAS Build (release)
- Affiliate links (Awin / Expedia Group) for monetization

## Getting started

```bash
nvm use 20                  # Node 20+
npm install
cp .env.local.example .env.local
# fill in EXPO_PUBLIC_SUPABASE_*, SUPABASE_SERVICE_ROLE_KEY,
# ANTHROPIC_API_KEY, SERPAPI_KEY, GOOGLE_PLACES_API_KEY
npm run web                 # web dev server (Metro)
# or:
npm run ios                 # iOS simulator (Mac only)
npm run android             # Android emulator
```

Open <http://localhost:8081>.

## Supabase setup

1. Create a project at [supabase.com](https://app.supabase.com).
2. Open the SQL editor and paste in [`db/schema.sql`](./db/schema.sql) — this creates all tables, indexes, and Row-Level Security policies.
3. Copy your project URL + anon key + service role key into `.env.local`.

## Project layout

```
app/                          — Expo Router file-based routes
  _layout.tsx                 — root layout (Stack + SafeAreaProvider)
  index.tsx                   — home (hero + trip form)
  results.tsx                 — ranked listings (fetches /api/search)
  saved.tsx, about.tsx, …     — static + bookmarked pages
  api/
    health+api.ts             — health check
    search+api.ts             — thin handler over src/server/search/pipeline
    parse-trip+api.ts         — Claude trip parser
    places-autocomplete+api.ts — Google Places autocomplete
src/
  components/
    trip-form/                — split form (hook + sections + orchestrator)
    listing-card.tsx, sortable-listings.tsx, save-button.tsx,
    place-autocomplete.tsx
  client/                     — universal client wrappers (apiBase, search,
                                parse-trip, places)
  lib/
    supabase.ts               — universal Supabase client
    kv-store.{ts,web,native}  — universal key-value adapter
    saved.ts, types.ts, …
  server/
    search/pipeline.ts        — server-only ranking pipeline
netlify.toml                  — Expo server adapter config
netlify/functions/server.ts   — `expo-server/adapter/netlify` entry
```

## Roadmap (21 features)

**Phase 1 — Foundation** *(done)*
Scaffold, Supabase wiring, schema, trip input form, results skeleton.

**Phase 2 — Data**
Wire VRBO + Booking Apify actors → Supabase listings table.

**Phase 3 — Core ranking**
Value Score, Total Cost engine, Group Fit, "why this is good/bad" reasons,
top-5 results, House vs Hotel comparison, Decision Mode.

**Phase 4 — Smart filters**
Bed Truth, Bathroom Filter, Pool Quality, Waterfront Truth, Renovation Score,
Location Intelligence, Hard Filters.

**Phase 5 — ML / heavy**
Photo Intelligence, BS Filter, Duplicate Detection, Watch Mode, Flexible Date Optimizer.

## Contributing

Two-person collab — see [CONTRIBUTING.md](./CONTRIBUTING.md) for the
branch → PR → merge loop, how to recover from common git mistakes, and
how to use the GitHub project board for sprint planning.

## Deploying

Production deploys go to Netlify, triggered by tag pushes. Beginner
path: GitHub Releases → "Draft a new release" → tag `vX.Y.Z` → Publish.
Full instructions in [CONTRIBUTING.md](./CONTRIBUTING.md#releasing).

