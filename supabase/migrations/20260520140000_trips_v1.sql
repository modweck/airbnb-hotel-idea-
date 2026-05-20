-- =====================================================================
-- Trips v1: trips, trip_members, trip_listings + RLS
-- Issue: #44 (M1 Foundation)
--
-- Scope notes:
--  - This migration ONLY introduces trips/trip_members/trip_listings.
--    votes/comments land in #53 (M2). bookings lands in #64 (M3).
--  - Auth v1 is anonymous + share-link. Clients never use the supabase
--    anon key directly. A supabase Edge Function (out of scope here)
--    reads the member_token cookie, hashes it, looks up trip_members,
--    and mints a short-lived JWT with custom claim `trip_member_id`.
--    RLS keys off that claim via public.current_trip_member_id().
--  - Trip creation and member-join MUST happen inside a single DB
--    transaction (one RPC call or one BEGIN/COMMIT) because the
--    trips.owner_member_id FK is DEFERRABLE INITIALLY DEFERRED but is
--    still checked at COMMIT. The RPC lives in #46.
--  - User-controlled mutability is restricted via column-level GRANTs
--    plus a hard trigger on trip_members. Defense in depth: if either
--    layer is bypassed the other still holds.
-- =====================================================================

set local check_function_bodies = on;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.trips (
  id              uuid        primary key default gen_random_uuid(),
  slug            text        not null unique,
  title           text        not null,
  destination     text        not null,
  check_in        date        not null,
  check_out       date        not null,
  group_size      int         not null,
  owner_member_id uuid        not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint trips_slug_format
    check (slug = lower(slug) and slug ~ '^[a-z0-9-]+$' and length(slug) between 3 and 64),
  constraint trips_dates_ordered    check (check_out > check_in),
  constraint trips_group_size_positive check (group_size > 0)
);

create table public.trip_members (
  id                 uuid        primary key default gen_random_uuid(),
  trip_id            uuid        not null references public.trips(id) on delete cascade,
  -- Bearer secret: never store the raw member_token cookie. The Edge
  -- Function sha256-hashes the incoming cookie and looks up by
  -- member_token_hash. If the DB leaks, attackers see hashes only.
  member_token_hash  text        not null unique,
  user_id            uuid        null references auth.users(id) on delete set null, -- v2 (#74)
  display_name       text        not null,
  email              text        null,
  role               text        not null,
  created_at         timestamptz not null default now(),
  constraint trip_members_role_valid check (role in ('owner','member')),
  -- Composite uniqueness so cross-table FKs can guarantee
  -- "member belongs to this trip" at the database level.
  constraint trip_members_trip_id_id_uniq unique (trip_id, id)
);

create table public.trip_listings (
  id               uuid        primary key default gen_random_uuid(),
  trip_id          uuid        not null references public.trips(id) on delete cascade,
  listing_id       text        not null,        -- SerpAPI property_token
  listing_snapshot jsonb       not null,        -- frozen Listing payload
  added_by         uuid        not null,
  rank             int         not null,
  created_at       timestamptz not null default now(),
  constraint trip_listings_trip_listing_uniq unique (trip_id, listing_id),
  -- Composite FK: the adder must belong to this same trip.
  constraint trip_listings_added_by_in_trip
    foreign key (trip_id, added_by)
    references public.trip_members (trip_id, id)
    on delete restrict
);

-- Composite FK on trips: the owner must belong to this same trip.
-- DEFERRED so we can insert trips and trip_members together in one tx.
alter table public.trips
  add constraint trips_owner_in_trip
  foreign key (id, owner_member_id)
  references public.trip_members (trip_id, id)
  deferrable initially deferred;

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------

create index trip_members_trip_id_idx   on public.trip_members(trip_id);
create index trip_listings_trip_id_idx  on public.trip_listings(trip_id);
create index trip_listings_trip_rank_idx on public.trip_listings(trip_id, rank);

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- trip_members: block tampering with identity/affiliation columns
--
-- Even with column-level GRANTs we add a trigger so that a future
-- accidental GRANT or a PostgREST quirk cannot let a member change
-- their trip_id, role, member_token_hash, or user_id.
-- The service role bypasses RLS but NOT triggers, so the Edge Function
-- must use SET LOCAL session_replication_role = 'replica' inside its
-- privileged tx to skip this trigger when promoting an anon member to
-- a real user (#74). Documented for the future Edge Function author.
-- ---------------------------------------------------------------------

create or replace function public.trip_members_block_identity_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.trip_id           is distinct from old.trip_id           then
    raise exception 'trip_members.trip_id is immutable';
  end if;
  if new.member_token_hash is distinct from old.member_token_hash then
    raise exception 'trip_members.member_token_hash is immutable';
  end if;
  if new.role              is distinct from old.role              then
    raise exception 'trip_members.role is immutable from client; use service role';
  end if;
  if new.user_id           is distinct from old.user_id           then
    raise exception 'trip_members.user_id changes only via service role';
  end if;
  if new.id                is distinct from old.id                then
    raise exception 'trip_members.id is immutable';
  end if;
  return new;
end;
$$;

create trigger trip_members_block_identity_change
  before update on public.trip_members
  for each row execute function public.trip_members_block_identity_change();

-- ---------------------------------------------------------------------
-- Helper functions for RLS
-- ---------------------------------------------------------------------

-- Reads the JWT custom claim trip_member_id. Pure (no table access),
-- so SECURITY INVOKER is sufficient. Locking search_path to '' forces
-- every reference to be schema-qualified.
create or replace function public.current_trip_member_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(
    coalesce(
      (auth.jwt() ->> 'trip_member_id'),
      ''
    ),
    ''
  )::uuid
$$;

-- Resolves the current member's trip_id. Must bypass RLS on
-- trip_members or every policy that uses it would recurse. Hence
-- SECURITY DEFINER. Owner is the migration role (typically `postgres`
-- on Supabase) which has full access; the function body is minimal
-- and parameterless so injection is not a concern.
create or replace function public.current_trip_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select trip_id
  from public.trip_members
  where id = public.current_trip_member_id()
$$;

-- Lock down execute privileges. Supabase default-grants EXECUTE on
-- functions in `public` to anon and authenticated; we want only
-- authenticated to call these, and never anon.
revoke execute on function public.current_trip_member_id() from public, anon;
revoke execute on function public.current_trip_id()        from public, anon;
grant  execute on function public.current_trip_member_id() to authenticated;
grant  execute on function public.current_trip_id()        to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------

alter table public.trips         enable row level security;
alter table public.trip_members  enable row level security;
alter table public.trip_listings enable row level security;

-- service_role bypasses RLS by Supabase default; we do not write any
-- policies for it. Edge Functions use service_role for trip creation,
-- member join, and any privileged operation (promoting anon -> user).

-- ----- trips -----

create policy trips_select_member on public.trips
  for select to authenticated
  using (id = public.current_trip_id());

create policy trips_update_owner on public.trips
  for update to authenticated
  using (
    id = public.current_trip_id()
    and owner_member_id = public.current_trip_member_id()
  )
  with check (
    id = public.current_trip_id()
    and owner_member_id = public.current_trip_member_id()
  );

-- No INSERT/DELETE policy on trips: creation and deletion only via
-- service role (Edge Function / RPC).

-- ----- trip_members -----

create policy trip_members_select_same_trip on public.trip_members
  for select to authenticated
  using (trip_id = public.current_trip_id());

create policy trip_members_update_self on public.trip_members
  for update to authenticated
  using (id = public.current_trip_member_id())
  with check (id = public.current_trip_member_id());

-- No INSERT/DELETE for clients. Member join + member removal go
-- through the Edge Function.

-- ----- trip_listings -----

create policy trip_listings_select_same_trip on public.trip_listings
  for select to authenticated
  using (trip_id = public.current_trip_id());

create policy trip_listings_insert_self on public.trip_listings
  for insert to authenticated
  with check (
    trip_id = public.current_trip_id()
    and added_by = public.current_trip_member_id()
  );

-- Reorder/edit: members can update rank on any listing in their trip.
-- Column-level GRANT below limits what they can actually change.
create policy trip_listings_update_same_trip on public.trip_listings
  for update to authenticated
  using (trip_id = public.current_trip_id())
  with check (trip_id = public.current_trip_id());

-- Only the adder can remove their own listing; owner-level removals
-- go through service role.
create policy trip_listings_delete_self on public.trip_listings
  for delete to authenticated
  using (
    trip_id = public.current_trip_id()
    and added_by = public.current_trip_member_id()
  );

-- ---------------------------------------------------------------------
-- Grants (defense in depth; do not rely on Supabase defaults)
-- ---------------------------------------------------------------------

-- Postgres 15+ no longer auto-grants USAGE on `public` to PUBLIC. Be
-- explicit: only authenticated needs schema-level USAGE. anon has no
-- direct access at all; it talks only to Edge Functions.
grant usage on schema public to authenticated;

-- Anon role: zero direct access. All anon traffic goes through Edge
-- Functions backed by service_role.
revoke all on public.trips         from anon;
revoke all on public.trip_members  from anon;
revoke all on public.trip_listings from anon;

-- Authenticated role: revoke defaults, then grant the minimum.
revoke all on public.trips         from authenticated;
revoke all on public.trip_members  from authenticated;
revoke all on public.trip_listings from authenticated;

-- trips: read full row, update only mutable columns.
grant select on public.trips to authenticated;
grant update (title, destination, check_in, check_out, group_size, updated_at)
  on public.trips to authenticated;

-- trip_members: SELECT excludes member_token_hash (bearer secret).
-- UPDATE limited to user-facing profile columns.
grant select (id, trip_id, user_id, display_name, email, role, created_at)
  on public.trip_members to authenticated;
grant update (display_name, email) on public.trip_members to authenticated;

-- trip_listings: full read, insert, delete; update limited to rank.
grant select, insert, delete on public.trip_listings to authenticated;
grant update (rank) on public.trip_listings to authenticated;
