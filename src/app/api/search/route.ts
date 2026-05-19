import { type NextRequest } from "next/server";
import { searchTrip, type SearchTripInput } from "@/server/search/pipeline";

function parseNum(s: string | null): number | undefined {
  if (s === null || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const location = sp.get("location") ?? sp.get("destination");
  const checkIn = sp.get("checkIn");
  const checkOut = sp.get("checkOut");

  if (!location || !checkIn || !checkOut) {
    return Response.json(
      { error: "location, checkIn, and checkOut are required" },
      { status: 400 },
    );
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    return Response.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 },
    );
  }
  if (checkOutDate.getTime() <= checkInDate.getTime()) {
    return Response.json(
      { error: "checkOut must be after checkIn." },
      { status: 400 },
    );
  }

  const stayType = (sp.get("stayType") ?? "both") as
    | "houses"
    | "hotels"
    | "both";
  const budgetMode = (sp.get("budgetMode") === "per_person"
    ? "per_person"
    : "total") as "total" | "per_person";

  const input: SearchTripInput = {
    location,
    checkIn,
    checkOut,
    groupSize: parseNum(sp.get("groupSize")) ?? 2,
    pairs: parseNum(sp.get("pairs")) ?? 0,
    stayType,
    minBeds: parseNum(sp.get("minBeds")),
    minBathrooms: parseNum(sp.get("minBathrooms")),
    budgetMin: parseNum(sp.get("budgetMin")),
    budgetMax: parseNum(sp.get("budgetMax")),
    budgetMode,
    vibes: sp.get("vibes")?.split(",").filter(Boolean) ?? [],
    distanceTo: sp.get("distanceTo") ?? undefined,
  };

  try {
    const result = await searchTrip(input);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
