import type { Listing } from "@/lib/types";

export type SortOption = "price" | "distance" | "rating" | "vibe";

const VIBE_ORDER = { lively: 0, moderate: 1, quiet: 2 } as const;

export function sortListings(listings: Listing[], sort: SortOption): Listing[] {
  const sorted = [...listings];
  switch (sort) {
    case "price":
      return sorted.sort(
        (a, b) => a.pricing.totalForStay - b.pricing.totalForStay,
      );
    case "distance":
      return sorted.sort(
        (a, b) => (a.distanceMi ?? 9999) - (b.distanceMi ?? 9999),
      );
    case "rating": {
      // Prefer real guest rating (0–5); fall back to hotel class for listings
      // where SerpAPI didn't return a user score.
      const score = (l: Listing): number =>
        l.guestRating ?? l.hotelStars ?? 0;
      return sorted.sort((a, b) => score(b) - score(a));
    }
    case "vibe":
      return sorted.sort(
        (a, b) =>
          VIBE_ORDER[a.vibeTag ?? "quiet"] - VIBE_ORDER[b.vibeTag ?? "quiet"],
      );
  }
}
