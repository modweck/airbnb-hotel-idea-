// Smoke tests for the trip data contract.
//
// Acceptance criterion from issue #85: "All three fixture files
// import cleanly" + tsc passes + modweck can `import { tripFixture }
// from "@/__fixtures__/trip-board"`. This file proves all of that and
// guards against silent fixture drift (vote pointing at a deleted
// member, listing snapshot id mismatching the TripListing id, etc.).

import { describe, expect, it } from "vitest";

import {
  consensusByListingFixture,
  listingsFixture,
  membersFixture,
  summaryFixture,
  tripFixture,
  votesFixture,
} from "@/__fixtures__/trip-board";
import {
  listingDetailConsensusFixture,
  listingDetailFixture,
  listingDetailVotesFixture,
} from "@/__fixtures__/listing-detail";

describe("trip-board fixture", () => {
  it("trip owner is in the members list with role 'owner'", () => {
    const owner = membersFixture.find((m) => m.id === tripFixture.ownerMemberId);
    expect(owner).toBeDefined();
    expect(owner?.role).toBe("owner");
  });

  it("every member belongs to the trip", () => {
    for (const m of membersFixture) {
      expect(m.tripId).toBe(tripFixture.id);
    }
  });

  it("members have unique ids and unique tokens", () => {
    const ids = membersFixture.map((m) => m.id);
    const tokens = membersFixture.map((m) => m.memberToken);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it("every TripListing belongs to the trip and was added by a known member", () => {
    const memberIds = new Set(membersFixture.map((m) => m.id));
    for (const l of listingsFixture) {
      expect(l.tripId).toBe(tripFixture.id);
      expect(memberIds.has(l.addedByMemberId)).toBe(true);
    }
  });

  it("listingId mirrors the snapshot's external id", () => {
    for (const l of listingsFixture) {
      expect(l.listingId).toBe(l.listingSnapshot.sourceId);
    }
  });

  it("every vote references an existing TripListing and member", () => {
    const listingIds = new Set(listingsFixture.map((l) => l.id));
    const memberIds = new Set(membersFixture.map((m) => m.id));
    for (const v of votesFixture) {
      expect(listingIds.has(v.tripListingId)).toBe(true);
      expect(memberIds.has(v.tripMemberId)).toBe(true);
    }
  });

  it("(listingId, memberId) is unique across votes", () => {
    const keys = votesFixture.map((v) => `${v.tripListingId}:${v.tripMemberId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("consensus map covers every listing exactly once", () => {
    const consensusKeys = Object.keys(consensusByListingFixture).sort();
    const listingIds = listingsFixture.map((l) => l.id).sort();
    expect(consensusKeys).toEqual(listingIds);
  });

  it("consensus counts add up to totalMembers", () => {
    for (const [listingId, c] of Object.entries(consensusByListingFixture)) {
      const expectedTotal = membersFixture.length;
      expect(c.totalMembers, listingId).toBe(expectedTotal);
      expect(c.loveCount + c.passCount + c.unsetCount, listingId).toBe(expectedTotal);
    }
  });

  it("consensus percent matches loveCount / totalMembers (when not null)", () => {
    for (const [listingId, c] of Object.entries(consensusByListingFixture)) {
      if (c.percent === null) continue;
      const expected = Math.round((c.loveCount / c.totalMembers) * 100);
      expect(c.percent, listingId).toBe(expected);
    }
  });

  it("consensus counts match the actual votesFixture", () => {
    for (const l of listingsFixture) {
      const votesForListing = votesFixture.filter((v) => v.tripListingId === l.id);
      const love = votesForListing.filter((v) => v.value === "love_it").length;
      const pass = votesForListing.filter((v) => v.value === "pass").length;
      const unset = votesForListing.filter((v) => v.value === "unset").length;
      const c = consensusByListingFixture[l.id];
      expect(c.loveCount, l.id).toBe(love);
      expect(c.passCount, l.id).toBe(pass);
      expect(c.unsetCount, l.id).toBe(unset);
    }
  });

  it("summary counts are internally consistent", () => {
    expect(summaryFixture.memberCount).toBe(membersFixture.length);
    expect(summaryFixture.shortlistedCount).toBe(listingsFixture.length);
    const expectedSaved = listingsFixture.filter((l) =>
      votesFixture.some((v) => v.tripListingId === l.id && v.value === "love_it"),
    ).length;
    expect(summaryFixture.savedCount).toBe(expectedSaved);
    const expectedUndecided = Object.values(consensusByListingFixture).filter(
      (c) => c.status === "needs_votes",
    ).length;
    expect(summaryFixture.undecidedCount).toBe(expectedUndecided);
  });
});

describe("listing-detail fixture", () => {
  it("points at a TripListing that exists in the trip-board fixture", () => {
    expect(listingsFixture).toContain(listingDetailFixture);
  });

  it("includes one vote per member", () => {
    expect(listingDetailVotesFixture.length).toBe(membersFixture.length);
    const memberIds = new Set(membersFixture.map((m) => m.id));
    for (const v of listingDetailVotesFixture) {
      expect(memberIds.has(v.tripMemberId)).toBe(true);
      expect(v.tripListingId).toBe(listingDetailFixture.id);
    }
  });

  it("consensus matches votes", () => {
    const love = listingDetailVotesFixture.filter((v) => v.value === "love_it").length;
    const pass = listingDetailVotesFixture.filter((v) => v.value === "pass").length;
    const unset = listingDetailVotesFixture.filter((v) => v.value === "unset").length;
    expect(listingDetailConsensusFixture.loveCount).toBe(love);
    expect(listingDetailConsensusFixture.passCount).toBe(pass);
    expect(listingDetailConsensusFixture.unsetCount).toBe(unset);
  });
});
