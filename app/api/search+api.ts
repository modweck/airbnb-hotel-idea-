import { searchTrip, type SearchTripInput } from "@/server/search/pipeline";

export async function POST(request: Request) {
  const input = (await request.json()) as SearchTripInput;
  const result = await searchTrip(input);
  return Response.json(result);
}
