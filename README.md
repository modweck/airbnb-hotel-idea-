# Trip Planner — best bang for your buck

AI trip planner that finds the 3–5 best stays for your group across VRBO, Booking.com, and more — ranked by real value, not just price.

Not another search engine. A **decision engine**.

## Stack

- **Next.js 16** + TypeScript + Tailwind v4 (App Router)
- **Supabase** — Postgres + auth
- **Apify** — VRBO + Booking.com scrapers
- Affiliate links (Awin / Expedia Group) for monetization

## Getting started

```bash
npm install
cp .env.local.example .env.local
# fill in Supabase + Apify keys
npm run dev
```

Open http://localhost:3000.

## Supabase setup

1. Create a project at [supabase.com](https://app.supabase.com).
2. Open the SQL editor and paste in [`db/schema.sql`](./db/schema.sql) — this creates all tables, indexes, and Row-Level Security policies.
3. Copy your project URL + anon key + service role key into `.env.local`.

## Project layout

```
src/
  app/
    page.tsx           — home with trip input form
    results/page.tsx   — ranked listings (skeleton; pipeline TBD)
  components/
    trip-form.tsx      — the trip input form
  lib/
    types.ts           — unified Listing / TripInput / HardFilters types
    supabase/
      client.ts        — browser Supabase client
      server.ts        — server Supabase client (RSC, Server Actions)
      proxy.ts         — session refresh helper for proxy.ts
proxy.ts               — Next.js 16 proxy (was middleware) for auth
db/schema.sql          — Postgres schema for Supabase
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
