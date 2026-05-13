import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q");
    if (!query || query.length < 2) {
      return Response.json([]);
    }

    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) {
      return Response.json({ debug: "no key found", envKeys: Object.keys(process.env).filter(k => k.includes("GOOGLE") || k.includes("SERP")) }, { status: 200 });
    }

    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
      },
      body: JSON.stringify({ input: query }),
    });

    if (!res.ok) {
      return Response.json([]);
    }

    const data = (await res.json()) as {
      suggestions?: {
        placePrediction?: {
          text?: { text: string };
          placeId?: string;
        };
      }[];
    };

    const suggestions = (data.suggestions ?? [])
      .map((s) => s.placePrediction?.text?.text)
      .filter(Boolean)
      .slice(0, 5);

    return Response.json(suggestions);
  } catch {
    return Response.json([]);
  }
}
