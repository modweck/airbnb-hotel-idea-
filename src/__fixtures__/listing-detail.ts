// Listing Detail fixture — mirrors the "Modern A-Frame" detail screen
// in docs/mockups/post-search-booking/. Reuses the TripListing and
// members from trip-board.ts so IDs stay consistent across screens.

import type { ConsensusStatus, TripListing, Vote } from "@/lib/trip-types";
import { listingsFixture, votesFixture } from "@/__fixtures__/trip-board";

const aFrame = listingsFixture.find((l) => l.id === "tl_aframe");
if (!aFrame) {
  // Defensive: trip-board fixture is the source of truth.
  throw new Error("trip-board fixture must contain tl_aframe");
}

export const listingDetailFixture: TripListing = aFrame;

export const listingDetailVotesFixture: Vote[] = votesFixture.filter(
  (v) => v.tripListingId === "tl_aframe",
);

export const listingDetailConsensusFixture: ConsensusStatus = {
  status: "top_pick",
  percent: 80,
  loveCount: 4,
  passCount: 0,
  unsetCount: 1,
  totalMembers: 5,
};
