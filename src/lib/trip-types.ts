// Universal data contract for the group trip-planning + voting +
// booking flow. Pure types — no runtime exports. Mirrors the
// Supabase schema 1:1 (see docs/architecture/trip-data-model.md §4).
//
// UI screens, the server, and fixtures all import shapes from this
// file. NEVER import from `src/server/**` here.

import type { Listing } from "@/lib/types";

export type MemberRole = "owner" | "member";

/**
 * A planned group trip — the root entity. Members vote on listings
 * attached to a trip; eventually one listing is selected and booked.
 */
export interface Trip {
  id: string;
  /** Public share-link key. Lowercase, URL-safe. */
  slug: string;
  title: string;        // e.g. "Lake Tahoe 2026"
  destination: string;  // e.g. "Lake Tahoe, CA"
  checkIn: string;      // ISO date (YYYY-MM-DD)
  checkOut: string;     // ISO date
  groupSize: number;
  ownerMemberId: string;
  createdAt: string;    // ISO datetime
  updatedAt: string;
}

/**
 * A participant in a Trip. In v1 they're anonymous, identified by a
 * `memberToken` cookie. `userId` lands once Supabase Auth is in (#74).
 */
export interface TripMember {
  id: string;
  tripId: string;
  memberToken: string;
  userId: string | null;
  displayName: string;
  email: string | null;
  role: MemberRole;
  createdAt: string;
}

/**
 * A snapshot of an external listing, frozen at the time it was added
 * to a Trip's shortlist. Today this is the same shape as the unified
 * search-result `Listing`. If `Listing` evolves and we need to
 * version snapshots, narrow this alias here rather than touching
 * every call site.
 */
export type TripListingSnapshot = Listing;

/**
 * One shortlisted listing on a Trip. Members vote on `TripListing`s,
 * not on the underlying `Listing`.
 */
export interface TripListing {
  id: string;
  tripId: string;
  /** External id (e.g. SerpAPI property_token). Mirrors snapshot.sourceId. */
  listingId: string;
  listingSnapshot: TripListingSnapshot;
  addedByMemberId: string;
  rank: number;
  createdAt: string;
}

export type VoteValue = "love_it" | "pass" | "unset";

/**
 * A member's vote on a shortlisted listing. PK = (tripListingId,
 * tripMemberId). `unset` rows may be omitted server-side; absence is
 * treated as `unset` by `consensus.ts`.
 */
export interface Vote {
  tripListingId: string;
  tripMemberId: string;
  value: VoteValue;
  votedAt: string;
}

/** A free-text comment scoped to a TripListing (M2 surface). */
export interface Comment {
  id: string;
  tripListingId: string;
  tripMemberId: string;
  body: string;
  createdAt: string;
}

export type ConsensusKind = "top_pick" | "split_vote" | "needs_votes";

/**
 * Derived state for a TripListing's voting status. Computed by
 * `consensus.ts` (separate issue) — never persisted.
 *
 * `percent` denominator is `totalMembers` (NOT casters), so a listing
 * with 4 love + 1 unset out of 5 members reads as 80% — matching the
 * "GROUP CONSENSUS 80%" labels in the mockup.
 *
 * Thresholds (final values live with consensus.ts):
 *   - `top_pick`:    percent ≥ 75, no pass votes
 *   - `split_vote`:  any pass votes, or percent in [30, 75)
 *   - `needs_votes`: too few cast votes to classify (percent is null)
 */
export type ConsensusStatus =
  | {
      status: "top_pick";
      percent: number;
      loveCount: number;
      passCount: number;
      unsetCount: number;
      totalMembers: number;
    }
  | {
      status: "split_vote";
      percent: number;
      loveCount: number;
      passCount: number;
      unsetCount: number;
      totalMembers: number;
      /** First member who voted `pass`, if any — surfaced in mockup as "blocker". */
      blockerMemberId?: string;
    }
  | {
      status: "needs_votes";
      percent: number | null;
      loveCount: number;
      passCount: number;
      unsetCount: number;
      totalMembers: number;
      waitingOnMemberIds: string[];
    };

/**
 * Aggregate counters shown in the Trip Board header
 * ("5 MEMBERS · 5 SAVED · 2 UNDECIDED"). Derived; not persisted.
 */
export interface TripBoardSummary {
  memberCount: number;
  shortlistedCount: number;
  /** Listings with at least one `love_it` vote. */
  savedCount: number;
  /** Listings whose ConsensusStatus is `needs_votes`. */
  undecidedCount: number;
}
