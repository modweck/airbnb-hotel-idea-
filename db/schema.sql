-- Trip Planner schema
-- Run this in Supabase SQL editor: https://app.supabase.com/project/_/sql
-- Designed to support all 21 features in the spec, even ones not yet built.

-- ============================================================
-- profiles: extends auth.users with app-specific fields
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- ============================================================
-- trips: a saved trip search (user's input criteria)
-- ============================================================
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text,

  -- Smart Trip Input (feature 1)
  location text not null,
  check_in date,
  check_out date,

  -- Flexible Date Optimizer (feature 2)
  flexible_dates boolean default false,
  flexible_window_days int default 7,

  group_size int not null,
  budget_total numeric,
  budget_per_person numeric,

  -- Vibe (feature 1)
  vibes text[] default '{}'::text[],

  -- Hard Filters (feature 20) — stored as JSONB so we can evolve without migrations
  -- example: { "no_couch_beds": true, "pool": ["outdoor_in_ground"], "waterfront": true,
  --            "min_full_baths": 2, "renovated_only": true, "max_minutes_to_town": 15 }
  hard_filters jsonb default '{}'::jsonb,

  created_at timestamptz default now(),
  last_run_at timestamptz
);

-- ============================================================
-- listings: cached scrape results (shared across users)
-- ============================================================
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),

  -- Source identity
  source text not null,        -- 'vrbo' | 'booking' | 'expedia'
  source_id text not null,     -- the source's unique listing id
  type text not null,          -- 'house' | 'hotel'

  url text not null,
  affiliate_url text,          -- monetization deep link

  name text not null,
  description text,
  photos text[] default '{}'::text[],

  -- Structured data — kept as JSONB so the unified shape can evolve
  -- once we have real VRBO + Booking sample JSON to design against.
  location jsonb not null,     -- { town, region, country, lat, lng, walk_min_to_town, drive_min_to_town }
  capacity jsonb not null,     -- { max_guests, bedrooms, real_beds, couch_beds, bunk_beds }   feature 3
  bathrooms jsonb not null,    -- { full, half }                                                feature 4
  amenities jsonb,             -- { pool: {types,quality}, waterfront: {type,dock,beach}, ... } features 6, 7
  pricing jsonb,               -- { nightly_base, fees, taxes, total, per_person, currency }    feature 11

  -- Computed scores (filled by ranking pipeline)
  scores jsonb,                -- { value, group_fit, renovation, bs_flags: [...] }             features 5, 9, 12, 16
  photo_analysis jsonb,        -- { living_room_size, outdoor_space, renovation_level }         feature 10
  duplicate_group_id text,     -- groups duplicate listings across sources                       feature 17
  pros_cons jsonb,             -- { pros: [...], cons: [...] }                                   feature 18

  scraped_at timestamptz default now(),

  unique(source, source_id)
);

create index if not exists listings_location_gin on listings using gin (location);
create index if not exists listings_amenities_gin on listings using gin (amenities);

-- ============================================================
-- saved_listings: user favorites per trip                       feature 21
-- ============================================================
create table if not exists saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  trip_id uuid references trips(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  notes text,
  saved_at timestamptz default now(),
  unique(user_id, trip_id, listing_id)
);

-- ============================================================
-- watch_alerts: Watch Mode notifications                        feature 19
-- ============================================================
create table if not exists watch_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  trip_id uuid references trips(id) on delete cascade,
  alert_type text not null,    -- 'new_listing' | 'price_drop' | 'cancellation'
  triggered_at timestamptz default now(),
  payload jsonb
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles       enable row level security;
alter table trips          enable row level security;
alter table saved_listings enable row level security;
alter table watch_alerts   enable row level security;
-- listings is intentionally public-read (shared cache); writes happen server-side only.

-- profiles
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

-- trips
create policy "trips_select_own" on trips
  for select using (auth.uid() = user_id);
create policy "trips_insert_own" on trips
  for insert with check (auth.uid() = user_id);
create policy "trips_update_own" on trips
  for update using (auth.uid() = user_id);
create policy "trips_delete_own" on trips
  for delete using (auth.uid() = user_id);

-- saved_listings
create policy "saved_listings_all_own" on saved_listings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- watch_alerts
create policy "watch_alerts_select_own" on watch_alerts
  for select using (auth.uid() = user_id);
