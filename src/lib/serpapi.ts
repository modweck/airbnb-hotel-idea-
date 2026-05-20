// SerpAPI client for Google Hotels + Vacation Rentals searches.
// Docs: https://serpapi.com/google-hotels-api

import type { Listing, ListingType, ListingSource, PoolType } from "./types";

const SERPAPI_BASE = "https://serpapi.com/search.json";

interface SerpSearchParams {
  location: string;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;   // YYYY-MM-DD
  adults: number;
  rooms?: number;     // for hotels
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  vacationRentals?: boolean;
}

// Raw property from SerpAPI response
interface SerpProperty {
  type?: string;
  name?: string;
  description?: string;
  link?: string;
  property_token?: string;
  gps_coordinates?: { latitude: number; longitude: number };
  rate_per_night?: { extracted_lowest?: number; lowest?: string };
  total_rate?: { extracted_lowest?: number; lowest?: string; before_taxes_fees?: number };
  overall_rating?: number;
  reviews?: number;
  hotel_class?: number;
  amenities?: string[];
  images?: { thumbnail?: string; original_image?: string }[];
  essential_info?: string[];
  check_in_time?: string;
  check_out_time?: string;
  nearby_places?: { name: string; transportations?: { type: string; duration: string }[] }[];
}

interface SerpResponse {
  properties?: SerpProperty[];
  error?: string;
  search_metadata?: { status: string };
}

async function searchSerp(params: SerpSearchParams): Promise<SerpResponse> {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY not set in environment");

  const url = new URL(SERPAPI_BASE);
  url.searchParams.set("engine", "google_hotels");
  url.searchParams.set("api_key", key);
  url.searchParams.set("q", params.location);
  url.searchParams.set("check_in_date", params.checkIn);
  url.searchParams.set("check_out_date", params.checkOut);
  url.searchParams.set("adults", String(params.adults));
  url.searchParams.set("currency", "USD");
  url.searchParams.set("gl", "us");
  url.searchParams.set("hl", "en");

  if (params.vacationRentals) {
    url.searchParams.set("vacation_rentals", "true");
  }
  if (params.rooms && params.rooms > 1) {
    url.searchParams.set("rooms", String(params.rooms));
  }
  if (params.minPrice) {
    url.searchParams.set("min_price", String(params.minPrice));
  }
  if (params.maxPrice) {
    url.searchParams.set("max_price", String(params.maxPrice));
  }
  if (params.minBedrooms) {
    url.searchParams.set("bedrooms", String(params.minBedrooms));
  }
  if (params.minBathrooms) {
    url.searchParams.set("bathrooms", String(params.minBathrooms));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`SerpAPI request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<SerpResponse>;
}

function parseAmenities(amenities: string[] | undefined) {
  const list = (amenities ?? []).map((a) => a.toLowerCase());
  const poolTypes: PoolType[] = [];
  if (list.some((a) => a.includes("pool") && a.includes("indoor"))) poolTypes.push("indoor");
  if (list.some((a) => a.includes("pool") && !a.includes("indoor"))) poolTypes.push("outdoor_in_ground");

  return {
    pool: poolTypes.length ? { types: poolTypes } : undefined,
    hotTub: list.some((a) => a.includes("hot tub") || a.includes("jacuzzi")),
    parking: list.some((a) => a.includes("parking") || a.includes("garage")),
    wifi: list.some((a) => a.includes("wi-fi") || a.includes("wifi") || a.includes("internet")),
    ac: list.some((a) => a.includes("air conditioning") || a.includes("a/c")),
    kitchen: list.some((a) => a.includes("kitchen")),
    laundry: list.some((a) => a.includes("laundry") || a.includes("washer")),
  };
}

function parseEssentialInfo(info: string[] | undefined): {
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
} {
  let bedrooms = 0;
  let bathrooms = 0;
  let maxGuests = 0;

  for (const line of info ?? []) {
    const lower = line.toLowerCase();
    const bedroomMatch = lower.match(/(\d+)\s*bedroom/);
    if (bedroomMatch) bedrooms = parseInt(bedroomMatch[1], 10);
    const bathMatch = lower.match(/(\d+)\s*bathroom/);
    if (bathMatch) bathrooms = parseInt(bathMatch[1], 10);
    const guestMatch = lower.match(/(?:sleeps|up to|accommodates|guests?:?)\s*(\d+)/) ?? lower.match(/(\d+)\s*(guest|people)/);
    if (guestMatch) maxGuests = parseInt(guestMatch[1], 10);
  }

  return { bedrooms, bathrooms, maxGuests };
}

function serpPropertyToListing(
  prop: SerpProperty,
  isVacationRental: boolean,
  groupSize: number,
  nights: number,
): Listing {
  const essentials = parseEssentialInfo(prop.essential_info);
  const amenities = parseAmenities(prop.amenities);

  const nightlyBase = prop.rate_per_night?.extracted_lowest ?? 0;
  const totalForStay = prop.total_rate?.extracted_lowest ?? nightlyBase * nights;
  const totalPerPerson = groupSize > 0 ? Math.round(totalForStay / groupSize) : totalForStay;

  const type: ListingType = isVacationRental ? "house" : "hotel";

  // Try to detect source from the link
  let source: ListingSource = "booking";
  const link = prop.link ?? "";
  if (link.includes("vrbo")) source = "vrbo";
  else if (link.includes("expedia")) source = "expedia";

  return {
    id: prop.property_token ?? `serp-${Math.random().toString(36).slice(2, 10)}`,
    source,
    sourceId: prop.property_token ?? "",
    type,
    url: prop.link ?? "",
    name: prop.name ?? "Unnamed Property",
    hotelStars: prop.hotel_class,
    description: prop.description,
    photos: (prop.images ?? [])
      .map((img) => img.original_image ?? img.thumbnail ?? "")
      .filter(Boolean),

    location: {
      town: "",  // SerpAPI doesn't always split this out
      country: "US",
      lat: prop.gps_coordinates?.latitude,
      lng: prop.gps_coordinates?.longitude,
    },

    capacity: {
      maxGuests: essentials.maxGuests,
      bedrooms: essentials.bedrooms,
      realBeds: essentials.bedrooms,  // approximation — 1 bed per bedroom
      couchBeds: 0,
      bunkBeds: 0,
    },

    bathrooms: {
      full: essentials.bathrooms,
      half: 0,
    },

    amenities,

    pricing: {
      nightlyBase,
      fees: [],
      taxes: 0,
      totalForStay,
      totalPerPerson,
      currency: "USD",
    },

    scores: {
      value: 0,
      groupFit: 0,
      bsFlags: [],
    },

    scrapedAt: new Date().toISOString(),
  };
}

/** Drop listings with missing/broken data that SerpAPI sometimes returns */
function isValidListing(l: Listing): boolean {
  if (l.url === "" || l.pricing.totalForStay <= 0) return false;
  // No photo → looks empty / untrustworthy on the card; drop it.
  if (l.photos.length === 0) return false;
  // Hotels don't report bedrooms/maxGuests — only filter those for houses
  if (l.type === "house" && (l.capacity.bedrooms <= 0 || l.capacity.maxGuests <= 0)) return false;
  return true;
}

export interface SearchResults {
  houses: Listing[];
  hotels: Listing[];
}

export async function searchListings(params: {
  location: string;
  checkIn: string;
  checkOut: string;
  groupSize: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  stayType?: "houses" | "hotels" | "both";
  minStars?: number;
}): Promise<SearchResults> {
  const {
    location,
    checkIn,
    checkOut,
    groupSize,
    rooms,
    minPrice,
    maxPrice,
    minBedrooms,
    minBathrooms,
    stayType = "both",
    minStars,
  } = params;

  // Calculate nights for per-person math
  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const results: SearchResults = { houses: [], hotels: [] };

  // Run searches in parallel based on stayType
  const searches: Promise<void>[] = [];

  if (stayType === "houses" || stayType === "both") {
    // Vacation rentals: search for the full group (SerpAPI allows higher guest counts here)
    searches.push(
      searchSerp({
        location,
        checkIn,
        checkOut,
        adults: Math.min(groupSize, 6),  // Google caps at 6 but vacation rentals filter by capacity
        minPrice,
        maxPrice,
        minBedrooms,
        minBathrooms,
        vacationRentals: true,
      }).then((res) => {
        results.houses = (res.properties ?? [])
          .map((p) => serpPropertyToListing(p, true, groupSize, nights))
          .filter(isValidListing);
      })
    );
  }

  if (stayType === "hotels" || stayType === "both") {
    // Hotels: assume 2-queen rooms (4 people/room) since that's what groups book.
    const hotelRooms = rooms ?? Math.ceil(groupSize / 4);
    searches.push(
      searchSerp({
        location,
        checkIn,
        checkOut,
        adults: 2,  // search per-room price
        minPrice,
        maxPrice,
        vacationRentals: false,
      }).then((res) => {
        results.hotels = (res.properties ?? [])
          .filter((p) => !minStars || (p.hotel_class ?? 0) >= minStars)
          .map((p) => {
            const listing = serpPropertyToListing(p, false, groupSize, nights);
            // Multiply hotel price by number of rooms needed
            listing.pricing.nightlyBase *= hotelRooms;
            listing.pricing.totalForStay *= hotelRooms;
            listing.pricing.totalPerPerson =
              groupSize > 0
                ? Math.round(listing.pricing.totalForStay / groupSize)
                : listing.pricing.totalForStay;
            listing.hotelRooms = hotelRooms;
            return listing;
          })
          .filter(isValidListing);
      })
    );
  }

  await Promise.all(searches);

  return results;
}
