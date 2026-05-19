export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    if (!query || query.length < 2) {
      return Response.json([]);
    }

    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) {
      return Response.json([]);
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
