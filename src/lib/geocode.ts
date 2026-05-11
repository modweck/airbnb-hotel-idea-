// Geocode a place name to lat/lng using Google Places API (v1)

interface LatLng {
  lat: number;
  lng: number;
}

export async function geocodePlace(query: string): Promise<LatLng | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.location",
    },
    body: JSON.stringify({ textQuery: query }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    places?: { location?: { latitude: number; longitude: number } }[];
  };

  const loc = data.places?.[0]?.location;
  if (!loc) return null;

  return { lat: loc.latitude, lng: loc.longitude };
}

/** Haversine distance in miles between two lat/lng points */
export function distanceMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
