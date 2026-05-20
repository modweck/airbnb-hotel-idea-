# Trip data model — architecture

Long-lived reference for how the **group trip-planning data model** is
layered in this codebase, and how UI screens, server code, and the
Supabase schema relate to it.

Companion to [`../superpowers/plans/2026-05-19-post-search-booking-flow.md`](../superpowers/plans/2026-05-19-post-search-booking-flow.md).
That plan is the *spec*; this doc is the *map*.

Diagrams are Mermaid. View in:

- **PyCharm / IntelliJ:** open this file → click the preview pane
  (top-right split icon). Bundled Markdown plugin renders Mermaid; the
  optional JetBrains **Mermaid** plugin adds zoom + export.
- **VS Code:** "Markdown Preview Mermaid Support" extension, or just
  push the branch and view on GitHub (native rendering).
- **Browser:** paste into <https://mermaid.live>.

---

## 1. Module layering

Solid arrows = real imports. Dashed arrows = planned imports (issue
referenced on the edge). The green-bordered modules form the **stable
contract** that every M1 UI/server task depends on.

```mermaid
flowchart TB
  subgraph PLATFORM["Platform primitives (already on main)"]
    Listing["src/lib/types.ts<br/>Listing"]
    Kv["src/lib/kv-store.ts<br/>(universal sync/async kv)"]
  end

  subgraph CONTRACT["Trip data contract"]
    direction TB
    Types["src/lib/trip-types.ts<br/><b>Trip · TripMember · TripListing</b><br/><b>Vote · Comment</b><br/><b>ConsensusStatus · TripBoardSummary</b><br/>TripListingSnapshot = Listing"]:::ship
    Palette["src/lib/theme/palette.ts<br/>raw hex (defaultPalette)"]:::ship
    Theme["src/lib/theme.ts<br/>semantic colors · spacing · radii<br/>typography · consensusColorByStatus"]:::ship
    FixBoard["src/__fixtures__/trip-board.ts<br/>Lake Tahoe 2026 fixture"]:::ship
    FixDetail["src/__fixtures__/listing-detail.ts<br/>per-listing detail fixture"]:::ship
  end

  subgraph CONSUMERS["Consumers"]
    direction TB
    Consensus["src/lib/consensus.ts<br/>pure: votes → ConsensusStatus"]:::future
    TripStore["src/lib/trip-store.ts (#45)<br/>kv mirror + server sync"]:::future
    Affiliate["src/lib/affiliate.ts (#42)<br/>Travelpayouts URL rewriter"]:::future
    TripBoard["app/(trip)/[slug]/index.tsx (#47)<br/>Trip Board screen"]:::future
    ListingDetail["app/(trip)/[slug]/listing/[id]/index.tsx (#48)<br/>Listing Detail screen"]:::future
    Api["app/api/trips/**+api.ts (#46)<br/>create · get · vote · book"]:::future
    Supabase["Supabase migration (#44)<br/>trips · trip_members · trip_listings · votes · comments · bookings"]:::future
  end

  Listing --> Types
  Palette --> Theme
  Types --> FixBoard
  Types --> FixDetail

  Types  -.-> Consensus
  Types  -.-> TripStore
  Types  -.-> Api
  Types  -.-> TripBoard
  Types  -.-> ListingDetail
  Theme  -.-> TripBoard
  Theme  -.-> ListingDetail
  FixBoard -.-> TripBoard
  FixDetail -.-> ListingDetail
  Consensus -.-> TripBoard
  Consensus -.-> ListingDetail
  TripStore -.-> Kv
  TripStore -.-> Api
  Api -.-> Supabase
  Listing -.-> Affiliate

  classDef ship   stroke:#0E5E2F,stroke-width:3px,fill:#D7F0C8,color:#0B0B0B;
  classDef future stroke:#888,stroke-dasharray: 4 4,fill:#F5F5F0,color:#555;
```

### Rules of thumb

- **UI screens import from exactly three places:** `trip-types`,
  `theme`, and one fixture (until the live store + API land).
- **`src/server/**` is the secret boundary** (enforced by ESLint). The
  trip data contract is universal — types and fixtures must NEVER
  import from `src/server`. Server code may import the contract.
- **Snapshot reuse:** `TripListingSnapshot = Listing`. Today a 1:1
  alias; if `Listing` later changes shape, version the snapshot here
  rather than fixing every fixture call site.

---

## 2. Theme & palette — the swap mechanism

Two files so the palette can be iterated cheaply. UI code must never
reference raw hex.

```mermaid
flowchart LR
  subgraph LAYER1["Layer 1 — raw colors (swappable)"]
    P1["defaultPalette<br/>accent500 · neutral950 · green900 · …"]:::pal
    P2["altPalette<br/>(hypothetical)"]:::palAlt
  end

  subgraph LAYER2["Layer 2 — semantic tokens (theme.ts)"]
    Brand["colors.brand.{primary, onPrimary}"]:::sem
    Surface["colors.surface.{light, dark}"]:::sem
    Text["colors.text.{light, dark}"]:::sem
    Status["colors.status.{success, warning, info, neutral}"]:::sem
    Domain["consensusColorByStatus<br/>top_pick→success · split_vote→warning · needs_votes→info"]:::sem
  end

  subgraph LAYER3["Layer 3 — UI"]
    UI["screens · components · pills · buttons<br/>(only semantic tokens; no raw hex)"]:::ui
  end

  P1 -- "active import in theme.ts" --> Brand
  P1 --> Surface
  P1 --> Text
  P1 --> Status
  P2 -. "swap by changing one import" .-> Brand
  Brand --> UI
  Surface --> UI
  Text --> UI
  Status --> UI
  Domain --> UI

  classDef pal    stroke:#0E5E2F,stroke-width:2px,fill:#D7F0C8;
  classDef palAlt stroke:#888,stroke-dasharray:4 4,fill:#F5F5F0,color:#555;
  classDef sem    stroke:#1F4E7A,stroke-width:2px,fill:#CCE0F0;
  classDef ui     stroke:#7A5A1A,stroke-width:2px,fill:#F1E2B6;
```

### Changing the palette

1. **Tweak in place** — edit values in `src/lib/theme/palette.ts →
   defaultPalette`. One file, zero UI changes.
2. **A/B alternate** — add another `Palette` export, change the import
   line in `theme.ts`. Still one file.
3. **Re-skin consensus** — edit `consensusColorByStatus` in `theme.ts`.
   No UI changes.

Status colors are intentionally generic
(`success`/`warning`/`info`/`neutral`). Trip-domain mapping lives in
`consensusColorByStatus` so the theme stays reusable for non-trip UI.

---

## 3. Runtime data flow

How a user opening a trip and casting a vote moves through the layers.
Everything below `trip-types.ts` consumes it as its contract.

```mermaid
sequenceDiagram
  autonumber
  participant U   as User (web / iOS)
  participant UI  as Trip Board · Listing Detail
  participant CS  as consensus.ts (pure)
  participant TS  as trip-store.ts
  participant Kv  as kv-store
  participant API as app/api/trips/**+api.ts
  participant DB  as Supabase

  Note over UI,DB: All boxes consume trip-types.ts as their contract

  U->>UI: open /trip/<slug>
  UI->>TS: loadTrip(slug)
  TS->>Kv: read cached payload
  Kv-->>TS: cached (or empty)
  TS->>API: GET /api/trips/<slug>
  API->>DB: select trips · members · listings · votes
  DB-->>API: rows
  API-->>TS: TripPayload
  TS->>Kv: write-through cache
  TS-->>UI: { trip, members, listings, votes }
  UI->>CS: computeConsensus(votes, members) per listing
  CS-->>UI: ConsensusStatus[]
  UI-->>U: rendered board

  U->>UI: tap LOVE IT
  UI->>API: PUT /api/trips/<slug>/listings/<id>/vote
  API->>DB: upsert vote
  DB-->>API: ok
  API-->>UI: Vote
  UI->>CS: recompute consensus for that listing
  CS-->>UI: ConsensusStatus
  UI-->>U: pill state updates (e.g. "VOTE · 2" → "TOP PICK")
```

### Caching contract

- `trip-store.ts` is the only thing that reads/writes `kv-store` for
  trip data. Screens always go through the store, never directly to
  the API or to kv.
- Cache shape mirrors the contract types exactly — kv stores
  `{ trip: Trip, members: TripMember[], listings: TripListing[],
  votes: Vote[] }`. No projection layer.
- Writes are optimistic: store updates the kv copy first, fires the
  API call, rolls back on failure.

---

## 4. Mapping to Supabase

The TS contract and the SQL schema are 1:1 by design. Renames must
happen on both sides simultaneously.

| TS interface       | SQL table        | Notes |
|--------------------|------------------|-------|
| `Trip`             | `trips`          | `slug` is the public share-link key. |
| `TripMember`       | `trip_members`   | The cookie-bound `member_token` is sha256-hashed into `member_token_hash` server-side; clients never see it and the TS `TripMember` contract therefore omits it. `userId` lands with #74. |
| `TripListing`      | `trip_listings`  | `listingSnapshot` is `jsonb`, frozen at add time. |
| `Vote`             | `votes`          | PK = (`trip_listing_id`, `trip_member_id`). |
| `Comment`          | `comments`       | M2 surface. |
| `ConsensusStatus`  | *(computed)*     | Never persisted. Pure function of `votes` + member count. |
| `TripBoardSummary` | *(computed)*     | Derived counts for the board header. |

RLS lives with the migration issue (#44). Anon access is intermediated
by an Edge Function minting a short-lived JWT keyed off the member
cookie — the anon Supabase key is never used directly from clients.
