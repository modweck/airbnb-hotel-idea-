// Lake Tahoe 2026 — the canonical Trip Board fixture.
//
// Mirrors the post-search-booking mockup
// (docs/mockups/post-search-booking/). 5 members, 3 listings,
// one TOP PICK + one SPLIT VOTE + one NEEDS VOTES.
//
// UI screens import this directly while the live store + API are
// being built. Once trip-store.ts (#45) lands, screens switch to
// loading the same shape from kv/API and these fixtures get demoted
// to tests-only.
//
// Percent denominator convention: loveCount / totalMembers * 100
// (NOT loveCount / casters). 4 love out of 5 members = 80%, matching
// the mockup's "GROUP CONSENSUS 80%" label.

import type {
  ConsensusStatus,
  Trip,
  TripBoardSummary,
  TripListing,
  TripListingSnapshot,
  TripMember,
  Vote,
} from "@/lib/trip-types";

const TRIP_ID = "trip_tahoe_2026";

// ---------- Trip ----------

export const tripFixture: Trip = {
  id: TRIP_ID,
  slug: "tahoe-2026-xk9f",
  title: "Lake Tahoe 2026",
  destination: "Lake Tahoe, CA",
  checkIn: "2026-07-04",
  checkOut: "2026-07-11",
  groupSize: 5,
  ownerMemberId: "member_ikki",
  createdAt: "2026-04-18T14:02:11.000Z",
  updatedAt: "2026-05-19T09:41:00.000Z",
};

// ---------- Members ----------

export const membersFixture: TripMember[] = [
  {
    id: "member_ikki",
    tripId: TRIP_ID,
    userId: null,
    displayName: "Ikki",
    email: "ikki@example.com",
    role: "owner",
    createdAt: "2026-04-18T14:02:11.000Z",
  },
  {
    id: "member_maurice",
    tripId: TRIP_ID,
    userId: null,
    displayName: "Maurice",
    email: null,
    role: "member",
    createdAt: "2026-04-18T15:11:43.000Z",
  },
  {
    id: "member_jordan",
    tripId: TRIP_ID,
    userId: null,
    displayName: "Jordan",
    email: null,
    role: "member",
    createdAt: "2026-04-19T08:22:01.000Z",
  },
  {
    id: "member_priya",
    tripId: TRIP_ID,
    userId: null,
    displayName: "Priya",
    email: null,
    role: "member",
    createdAt: "2026-04-19T19:48:55.000Z",
  },
  {
    id: "member_sofia",
    tripId: TRIP_ID,
    userId: null,
    displayName: "Sofia",
    email: null,
    role: "member",
    createdAt: "2026-04-20T11:03:17.000Z",
  },
];

// ---------- Listing snapshots ----------
//
// Realistic-enough VRBO-style payloads; not pulled from a real
// SerpAPI response. All required Listing fields filled.

function snapshot(overrides: Partial<TripListingSnapshot> & {
  id: string; name: string; town: string;
  nightly: number; nights: number;
  maxGuests: number; bedrooms: number; realBeds: number;
  fullBaths: number;
}): TripListingSnapshot {
  const totalForStay = overrides.nightly * overrides.nights;
  return {
    id: overrides.id,
    source: "vrbo",
    sourceId: overrides.id,
    type: "house",
    url: `https://www.vrbo.com/listing/${overrides.id}`,
    name: overrides.name,
    description: overrides.description,
    photos: [
      `https://images.example.com/${overrides.id}/1.jpg`,
      `https://images.example.com/${overrides.id}/2.jpg`,
      `https://images.example.com/${overrides.id}/3.jpg`,
    ],
    location: {
      town: overrides.town,
      region: "CA",
      country: "USA",
      ...(overrides.location ?? {}),
    },
    capacity: {
      maxGuests: overrides.maxGuests,
      bedrooms: overrides.bedrooms,
      realBeds: overrides.realBeds,
      couchBeds: 0,
      bunkBeds: 0,
    },
    bathrooms: {
      full: overrides.fullBaths,
      half: 0,
    },
    amenities: {
      wifi: true,
      kitchen: true,
      ac: true,
      parking: true,
      ...(overrides.amenities ?? {}),
    },
    pricing: {
      nightlyBase: overrides.nightly,
      fees: [],
      taxes: 0,
      totalForStay,
      totalPerPerson: Math.round(totalForStay / 5),
      currency: "USD",
    },
    scrapedAt: "2026-05-19T09:30:00.000Z",
  };
}

const aFrameSnapshot = snapshot({
  id: "vrbo_aframe_truckee",
  name: "Modern A-Frame + Hot Tub",
  town: "Truckee",
  description:
    "Renovated A-frame in the Sierra Nevada foothills, 6 min from Truckee. " +
    "4 real beds, fast wifi, private hot tub on the deck. Ideal for groups — " +
    "spacious open-plan main floor with full kitchen and laundry.",
  nightly: 420,
  nights: 7,
  maxGuests: 8,
  bedrooms: 4,
  realBeds: 4,
  fullBaths: 2,
  amenities: { hotTub: true, laundry: true, wifi: true, kitchen: true, ac: true, parking: true },
});

const cozyCabinSnapshot = snapshot({
  id: "vrbo_cozy_cabin_slt",
  name: "Cozy Lakeside Cabin",
  town: "South Lake Tahoe",
  description: "Walk to the lake. 3 bedrooms, fireplace, deck.",
  nightly: 240,
  nights: 7,
  maxGuests: 6,
  bedrooms: 3,
  realBeds: 3,
  fullBaths: 2,
});

const waterfrontSnapshot = snapshot({
  id: "vrbo_waterfront_tahoe_city",
  name: "Waterfront Estate",
  town: "Tahoe City",
  description: "Private dock, 6 bedrooms, panoramic lake views.",
  nightly: 1850,
  nights: 7,
  maxGuests: 12,
  bedrooms: 6,
  realBeds: 7,
  fullBaths: 4,
  amenities: { wifi: true, kitchen: true, ac: true, parking: true, hotTub: true, laundry: true },
});

// ---------- TripListings ----------

export const listingsFixture: TripListing[] = [
  {
    id: "tl_aframe",
    tripId: TRIP_ID,
    listingId: aFrameSnapshot.id,
    listingSnapshot: aFrameSnapshot,
    addedByMemberId: "member_ikki",
    rank: 1,
    createdAt: "2026-04-22T18:14:00.000Z",
  },
  {
    id: "tl_cozy_cabin",
    tripId: TRIP_ID,
    listingId: cozyCabinSnapshot.id,
    listingSnapshot: cozyCabinSnapshot,
    addedByMemberId: "member_maurice",
    rank: 2,
    createdAt: "2026-04-23T10:02:00.000Z",
  },
  {
    id: "tl_waterfront",
    tripId: TRIP_ID,
    listingId: waterfrontSnapshot.id,
    listingSnapshot: waterfrontSnapshot,
    addedByMemberId: "member_jordan",
    rank: 3,
    createdAt: "2026-04-24T12:45:00.000Z",
  },
];

// ---------- Votes ----------
//
// TOP PICK (a-frame): 4 love, 0 pass, 1 unset (Priya). 4/5 = 80%.
// SPLIT VOTE (cozy cabin): 2 love, 0 pass, 3 unset. 2/5 = 40%.
//   Mockup label "VOTE · 2" → two cast votes, both love_it. The "split"
//   framing here is anticipatory; once any member passes it becomes a
//   true mixed-signal state. For now we model it as "stalled at 40%".
// NEEDS VOTES (waterfront): 1 love, 0 pass, 4 unset.

export const votesFixture: Vote[] = [
  // a-frame
  { tripListingId: "tl_aframe", tripMemberId: "member_ikki",    value: "love_it", votedAt: "2026-05-19T07:41:00.000Z" },
  { tripListingId: "tl_aframe", tripMemberId: "member_maurice", value: "love_it", votedAt: "2026-05-19T04:30:00.000Z" },
  { tripListingId: "tl_aframe", tripMemberId: "member_jordan",  value: "love_it", votedAt: "2026-05-18T13:11:00.000Z" },
  { tripListingId: "tl_aframe", tripMemberId: "member_sofia",   value: "love_it", votedAt: "2026-05-18T22:19:00.000Z" },
  { tripListingId: "tl_aframe", tripMemberId: "member_priya",   value: "unset",   votedAt: "2026-04-19T19:48:55.000Z" },

  // cozy cabin
  { tripListingId: "tl_cozy_cabin", tripMemberId: "member_ikki",    value: "love_it", votedAt: "2026-05-17T09:00:00.000Z" },
  { tripListingId: "tl_cozy_cabin", tripMemberId: "member_maurice", value: "love_it", votedAt: "2026-05-17T15:22:00.000Z" },
  { tripListingId: "tl_cozy_cabin", tripMemberId: "member_jordan",  value: "unset",   votedAt: "2026-04-19T08:22:01.000Z" },
  { tripListingId: "tl_cozy_cabin", tripMemberId: "member_priya",   value: "unset",   votedAt: "2026-04-19T19:48:55.000Z" },
  { tripListingId: "tl_cozy_cabin", tripMemberId: "member_sofia",   value: "unset",   votedAt: "2026-04-20T11:03:17.000Z" },

  // waterfront
  { tripListingId: "tl_waterfront", tripMemberId: "member_jordan",  value: "love_it", votedAt: "2026-05-18T17:55:00.000Z" },
  { tripListingId: "tl_waterfront", tripMemberId: "member_ikki",    value: "unset",   votedAt: "2026-04-18T14:02:11.000Z" },
  { tripListingId: "tl_waterfront", tripMemberId: "member_maurice", value: "unset",   votedAt: "2026-04-18T15:11:43.000Z" },
  { tripListingId: "tl_waterfront", tripMemberId: "member_priya",   value: "unset",   votedAt: "2026-04-19T19:48:55.000Z" },
  { tripListingId: "tl_waterfront", tripMemberId: "member_sofia",   value: "unset",   votedAt: "2026-04-20T11:03:17.000Z" },
];

// ---------- Consensus ----------
//
// What `consensus.ts` would output for each listing today. The
// thresholds and labels are encoded once here so UI fixtures don't
// drift from the eventual pure function.

export const consensusByListingFixture: Record<string, ConsensusStatus> = {
  tl_aframe: {
    status: "top_pick",
    percent: 80,
    loveCount: 4,
    passCount: 0,
    unsetCount: 1,
    totalMembers: 5,
  },
  tl_cozy_cabin: {
    status: "split_vote",
    percent: 40,
    loveCount: 2,
    passCount: 0,
    unsetCount: 3,
    totalMembers: 5,
  },
  tl_waterfront: {
    status: "needs_votes",
    percent: 20,
    loveCount: 1,
    passCount: 0,
    unsetCount: 4,
    totalMembers: 5,
    waitingOnMemberIds: ["member_ikki", "member_maurice", "member_priya", "member_sofia"],
  },
};

// ---------- Board summary ----------

export const summaryFixture: TripBoardSummary = {
  memberCount: membersFixture.length,
  shortlistedCount: listingsFixture.length,
  savedCount: listingsFixture.length, // all 3 have ≥ 1 love_it vote
  undecidedCount: 1,                  // waterfront only
};
