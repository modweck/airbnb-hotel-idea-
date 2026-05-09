// Unified types for the trip planner.
// Designed to support all 21 features in the spec.
// Will be refined once real VRBO + Booking JSON is available.

export type FlexibleDuration =
  | "1n"
  | "2-3n"
  | "4-5n"
  | "1w"
  | "2w"
  | "1mo";

export type ListingSource = "vrbo" | "booking" | "expedia";
export type ListingType = "house" | "hotel";
export type Vibe = "lively" | "chill" | "romantic" | "family" | "adventure" | "party";

export type PoolType =
  | "indoor"
  | "outdoor_in_ground"
  | "outdoor_above_ground"
  | "shared";

export type WaterfrontType =
  | "lakefront"
  | "beachfront"
  | "riverfront"
  | "view_only"
  | "none";

export type RenovationLevel = "modern" | "renovated" | "outdated" | "unknown";

export type BedType =
  | "king"
  | "queen"
  | "double"
  | "twin"
  | "bunkLevel"
  | "couch";

export interface BedCount {
  king: number;
  queen: number;
  double: number;
  twin: number;
  bunkLevel: number; // each level of a bunk = 1
  couch: number;     // sleeper sofas, daybeds, futons
}

export type BsFlag =
  | "fake_waterfront"
  | "tiny_pool"
  | "shared_pool"
  | "misleading_photos"
  | "bad_layout";

// What the user inputs on the home form.
export interface TripInput {
  location: string;
  checkIn?: string;          // ISO date
  checkOut?: string;         // ISO date
  flexibleDates: boolean;
  flexibleDuration?: FlexibleDuration;
  flexibleMustIncludeWeekend?: boolean;
  flexibleMonths?: string[]; // e.g. ["2026-04", "2026-05"]
  groupSize: number;
  // Sleep config (feature 3 — Bed Truth):
  // pairs = pairs sharing a bed (queen/king/double = 2 people each).
  // singles = groupSize - 2*pairs = solo sleepers, each needs their own bed (any size).
  pairs?: number;
  minBeds?: number;                                // feature 3 — Bed Truth
  stayType?: "houses" | "hotels" | "both";         // feature 14 — house vs hotel
  priority?: "value" | "location" | "vibe" | "overall"; // feature 15 — Decision Mode
  budgetMin?: number;
  budgetMax?: number;
  budgetMode?: "total" | "per_person";
  vibes: Vibe[];
  hardFilters: HardFilters;
}

export interface HardFilters {
  noCouchBeds?: boolean;
  noBunkBeds?: boolean;
  minFullBaths?: number;
  pool?: PoolType[];
  waterfrontRequired?: boolean;
  privateWaterfrontAccess?: boolean;  // private dock, beach, or path to the waterfront
  renovatedOnly?: boolean;
  maxMinutesToTown?: number;
  allowCouchBeds?: boolean;    // default false — couches don't count as real beds
}

// The unified listing shape — what the ranking + UI layers consume.
export interface Listing {
  id: string;
  source: ListingSource;
  sourceId: string;
  type: ListingType;

  url: string;
  affiliateUrl?: string;

  name: string;
  hotelStars?: number;  // 1-5 star rating for hotels
  description?: string;
  photos: string[];

  location: {
    address?: string;
    town: string;
    region?: string;
    country: string;
    lat?: number;
    lng?: number;
    walkMinutesToTown?: number;
    driveMinutesToTown?: number;
  };

  capacity: {
    maxGuests: number;
    bedrooms: number;
    realBeds: number;     // feature 3 — Bed Truth
    couchBeds: number;
    bunkBeds: number;
  };

  bathrooms: {
    full: number;         // feature 4
    half: number;
  };

  amenities: {
    pool?: { types: PoolType[]; quality?: "great" | "ok" | "poor" };  // feature 6
    waterfront?: {                                                     // feature 7
      type: WaterfrontType;
      hasDock: boolean;
      hasPrivateBeach: boolean;
    };
    hotTub?: boolean;
    parking?: boolean;
    wifi?: boolean;
    ac?: boolean;
    kitchen?: boolean;
    laundry?: boolean;
  };

  pricing: {              // feature 11 — Total Cost Engine
    nightlyBase: number;
    fees: { name: string; amount: number }[];
    taxes: number;
    totalForStay: number;
    totalPerPerson: number;
    currency: string;
  };

  // Computed scores
  scores?: {
    value: number;        // feature 12 — 0-100
    groupFit: number;     // feature 9
    renovation?: number;  // feature 5
    bsFlags: BsFlag[];    // feature 16
  };

  photoAnalysis?: {       // feature 10
    livingRoomSize?: "small" | "medium" | "large";
    outdoorSpace?: "minimal" | "moderate" | "expansive";
    renovationLevel?: RenovationLevel;
  };

  duplicateGroupId?: string;  // feature 17

  prosCons?: {              // feature 18
    pros: string[];
    cons: string[];
    goodFor?: string;
  };

  scrapedAt: string;
}
