// Determine listing "vibe" by proximity to nightlife hotspots.
// One Google Places search per city, then distance math for each listing.

import { distanceMiles } from "./geocode";

export type VibeTag = "lively" | "moderate" | "quiet";

interface LatLng {
  lat: number;
  lng: number;
}

/** Search Google Places for nightlife/bar clusters in a city. Returns hotspot coordinates. */
export async function findNightlifeHotspots(city: string): Promise<LatLng[]> {
  try {
    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) return [];

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.location",
      },
      body: JSON.stringify({
        textQuery: `popular bars and nightlife in ${city}`,
        maxResultCount: 10,
      }),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      places?: { location?: { latitude: number; longitude: number } }[];
    };

    return (data.places ?? [])
      .map((p) => p.location)
      .filter((loc): loc is { latitude: number; longitude: number } => loc != null)
      .map((loc) => ({ lat: loc.latitude, lng: loc.longitude }));
  } catch {
    return [];
  }
}

/** Distance in miles from a point to the nearest hotspot */
function distToNearestHotspot(point: LatLng, hotspots: LatLng[]): number {
  if (hotspots.length === 0) return Infinity;
  return Math.min(...hotspots.map((h) => distanceMiles(point, h)));
}

/** Tag a vibe based on distance to nearest nightlife hotspot */
export function tagVibe(distMiles: number): VibeTag {
  if (distMiles < 1) return "lively";
  if (distMiles <= 2) return "moderate";
  return "quiet";
}

/** Tag all listings with a vibe. Mutates listings in place. */
export function applyVibeToListings(
  listings: { location: { lat?: number; lng?: number }; vibeMi?: number; vibeTag?: VibeTag }[],
  hotspots: LatLng[],
): void {
  if (hotspots.length === 0) return;

  for (const l of listings) {
    if (l.location.lat != null && l.location.lng != null) {
      const dist = distToNearestHotspot(
        { lat: l.location.lat, lng: l.location.lng },
        hotspots,
      );
      l.vibeMi = Math.round(dist * 10) / 10;
      l.vibeTag = tagVibe(dist);
    }
  }
}
