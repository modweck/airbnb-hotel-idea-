import { describe, expect, test } from "vitest";
import type { Listing } from "@/lib/types";
import { sortListings } from "@/lib/listing-sort";

function makeListing(overrides: {
  id: string;
  guestRating?: number;
  hotelStars?: number;
  type?: "house" | "hotel";
}): Listing {
  return {
    id: overrides.id,
    source: "vrbo",
    sourceId: overrides.id,
    type: overrides.type ?? "house",
    url: `https://example.com/${overrides.id}`,
    name: `Listing ${overrides.id}`,
    photos: [],
    location: { town: "Tahoe", country: "US" },
    capacity: {
      maxGuests: 4,
      bedrooms: 2,
      realBeds: 2,
      couchBeds: 0,
      bunkBeds: 0,
    },
    bathrooms: { full: 1, half: 0 },
    amenities: {},
    pricing: {
      nightlyBase: 100,
      fees: [],
      taxes: 0,
      totalForStay: 300,
      totalPerPerson: 75,
      currency: "USD",
    },
    guestRating: overrides.guestRating,
    hotelStars: overrides.hotelStars,
    scrapedAt: "2026-05-20T00:00:00Z",
  };
}

describe("sortListings — rating", () => {
  test("prefers guestRating over hotelStars when both present", () => {
    const a = makeListing({ id: "a", guestRating: 4.8, hotelStars: 3 });
    const b = makeListing({ id: "b", guestRating: 4.2, hotelStars: 5 });
    const out = sortListings([b, a], "rating");
    expect(out.map((l) => l.id)).toEqual(["a", "b"]);
  });

  test("falls back to hotelStars when guestRating is missing", () => {
    const noRating = makeListing({ id: "stars-only", hotelStars: 4 });
    const withRating = makeListing({ id: "rating", guestRating: 3.5 });
    const out = sortListings([noRating, withRating], "rating");
    // hotelStars=4 > guestRating=3.5, so stars-only ranks first
    expect(out.map((l) => l.id)).toEqual(["stars-only", "rating"]);
  });

  test("listings with neither field get a score of 0 and rank last", () => {
    const nothing = makeListing({ id: "blank" });
    const rated = makeListing({ id: "rated", guestRating: 2.5 });
    const out = sortListings([nothing, rated], "rating");
    expect(out.map((l) => l.id)).toEqual(["rated", "blank"]);
  });

  test("sort is stable-ish across guestRating ties", () => {
    const a = makeListing({ id: "a", guestRating: 4.5 });
    const b = makeListing({ id: "b", guestRating: 4.5 });
    const c = makeListing({ id: "c", guestRating: 4.9 });
    const out = sortListings([a, b, c], "rating");
    expect(out[0].id).toBe("c");
    // a and b have equal scores; both come after c
    expect(out.slice(1).map((l) => l.id).sort()).toEqual(["a", "b"]);
  });

  test("does not mutate the input array", () => {
    const a = makeListing({ id: "a", guestRating: 3 });
    const b = makeListing({ id: "b", guestRating: 5 });
    const input = [a, b];
    sortListings(input, "rating");
    expect(input.map((l) => l.id)).toEqual(["a", "b"]);
  });
});
