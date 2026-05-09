import { type NextRequest } from "next/server";
import { searchListings } from "@/lib/serpapi";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const location = sp.get("location");
  const checkIn = sp.get("checkIn");
  const checkOut = sp.get("checkOut");
  const groupSize = parseInt(sp.get("groupSize") ?? "2", 10);

  if (!location || !checkIn || !checkOut) {
    return Response.json(
      { error: "location, checkIn, and checkOut are required" },
      { status: 400 }
    );
  }

  const stayType = (sp.get("stayType") ?? "both") as "houses" | "hotels" | "both";
  const pairs = parseInt(sp.get("pairs") ?? "0", 10);
  const budgetMin = sp.get("budgetMin") ? parseInt(sp.get("budgetMin")!, 10) : undefined;
  const budgetMax = sp.get("budgetMax") ? parseInt(sp.get("budgetMax")!, 10) : undefined;
  const budgetMode = sp.get("budgetMode") ?? "total";
  const minBeds = sp.get("minBeds") ? parseInt(sp.get("minBeds")!, 10) : undefined;
  const minBathrooms = sp.get("minBathrooms") ? parseInt(sp.get("minBathrooms")!, 10) : undefined;

  const peoplePerRoom = parseInt(sp.get("peoplePerRoom") ?? "4", 10);
  const minStars = sp.get("minStars") ? parseInt(sp.get("minStars")!, 10) : undefined;

  // Calculate hotel rooms based on people-per-room preference
  const hotelRooms = Math.ceil(groupSize / peoplePerRoom);

  // Budget: if per_person, multiply by groupSize to get total for SerpAPI filter
  const priceMin = budgetMode === "per_person" && budgetMin ? budgetMin * groupSize : budgetMin;
  const priceMax = budgetMode === "per_person" && budgetMax ? budgetMax * groupSize : budgetMax;

  try {
    const results = await searchListings({
      location,
      checkIn,
      checkOut,
      groupSize,
      rooms: hotelRooms,
      minPrice: priceMin,
      maxPrice: priceMax,
      minBedrooms: minBeds,
      minBathrooms,
      stayType,
      minStars,
    });

    return Response.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
