// Pluggable listing data source. /results consumes one provider at a time —
// we never mix listings from different sources in a single response. Swap
// providers by setting LISTING_SOURCE (defaults: "serpapi" if SERPAPI_KEY is
// set, otherwise "seed").

import type { Listing } from "@/lib/types";
import { SEED_LISTINGS } from "@/data/seed-listings";
import { searchListings } from "@/lib/serpapi";

export interface ListingQuery {
  location: string;
  checkIn: string;
  checkOut: string;
  groupSize: number;
  pairs?: number;
  stayType?: "houses" | "hotels" | "both";
  minBedrooms?: number;
  minBathrooms?: number;
}

export interface ListingProvider {
  name: string;
  fetch(query: ListingQuery): Promise<Listing[]>;
}

export const serpapiProvider: ListingProvider = {
  name: "serpapi",
  async fetch(q) {
    // Each hotel room has 2 queen/double beds → fits 4 people.
    // If user specified minBeds, use ceil(beds / 2 per room).
    // Otherwise use ceil(groupSize / 4 per room).
    const bedsPerRoom = 2;
    const guestsPerRoom = bedsPerRoom * 2; // 2 queen beds × 2 people each = 4
    const hotelRooms = q.minBedrooms
      ? Math.ceil(q.minBedrooms / bedsPerRoom)
      : Math.ceil(q.groupSize / guestsPerRoom);
    const results = await searchListings({
      location: q.location,
      checkIn: q.checkIn,
      checkOut: q.checkOut,
      groupSize: q.groupSize,
      rooms: hotelRooms || undefined,
      minBedrooms: q.minBedrooms,
      minBathrooms: q.minBathrooms,
      stayType: q.stayType ?? "both",
    });
    return [...results.houses, ...results.hotels];
  },
};

export const seedProvider: ListingProvider = {
  name: "seed",
  async fetch(q) {
    const stayType = q.stayType ?? "both";
    return SEED_LISTINGS.filter((l) => {
      if (stayType === "houses" && l.type !== "house") return false;
      if (stayType === "hotels" && l.type !== "hotel") return false;
      return true;
    });
  },
};

export function getListingProvider(): ListingProvider {
  const explicit = process.env.LISTING_SOURCE?.toLowerCase();
  if (explicit === "seed") return seedProvider;
  if (explicit === "serpapi") return serpapiProvider;
  return process.env.SERPAPI_KEY ? serpapiProvider : seedProvider;
}
