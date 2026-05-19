import Anthropic from "@anthropic-ai/sdk";
import { ParsedTripSchema } from "@/lib/trip-schema";

const SYSTEM_PROMPT = `You parse natural-language trip descriptions into structured form fields for a vacation-rental and hotel search app.

Extract only fields the user explicitly mentioned. NEVER guess. If the user did not mention a field, leave it out.

Field guidance:
- location: town/city/region the user wants to stay in
- groupSize: number of people on the trip
- pairs: number of pairs that will SHARE a bed (any sharing pair — couples, kids sharing a bunk, friends sharing a king — count as 1 pair each). Examples:
   - "8 friends, all single" → pairs: 0
   - "2 couples + 4 kids" → pairs: 2
   - "4 of us share, rest are solo" → pairs: 2 (4 people = 2 pairs)
   - "my wife and me + her parents + 4 kids" → pairs: 2 (us, the parents)
   - "10 guys" / "girls trip" → pairs: 0 (assume nobody is sharing unless stated)
- minBeds: minimum REAL beds (no couches). If user says "needs 5 beds" → 5. If user says "4 bedroom house" without specifying beds, set minBeds to 4 (one bed per bedroom is a sensible floor). Otherwise the app computes from groupSize - pairs.
- stayType: "houses" if user wants vacation rental / VRBO. "hotels" if user wants a hotel. "both" if either, or unspecified.
- priority: what matters most. "value" = best deal. "location" = closest to town. "vibe" = matches the feel. "overall" = best overall. Default to "value" if unclear.
- budgetMin / budgetMax: in USD. budgetMode = "total" (whole trip) or "per_person". Inferring mode from phrasing matters — listen for cues:
   - "$500 each" / "$300 a head" / "per person" / "pp" → per_person
   - "$4k total" / "for the whole trip" / "all in" / unmarked single number with group context → total
   - Examples:
     - "we want to spend $500 each" → budgetMin: 500, budgetMode: "per_person"
     - "$4k total budget" → budgetMax: 4000, budgetMode: "total"
     - "couple, around $300 a head" → budgetMin: 300, budgetMode: "per_person"
     - "we have $2000 for the whole trip" → budgetMax: 2000, budgetMode: "total"
- vibes: pick from {lively, chill, romantic, family, adventure, party} — only if user clearly signals one or more.
- Dates: only set checkIn/checkOut if user gives explicit dates. If they say "flexible" / "any time in summer" / "next month", set flexibleDates: true and use flexibleMonths (YYYY-MM strings). The user picks trip duration manually in the UI.
- hardFilters.pool: array of allowed pool types. Read negation carefully:
   - "real pool, no indoor or above ground" → ["outdoor_in_ground"] (only allow outdoor in-ground)
   - "outdoor pool" → ["outdoor_in_ground", "outdoor_above_ground"]
   - "any pool" → don't set the field
- hardFilters.waterfrontRequired: true only if user explicitly wants on the water (lake/beach/river)
- hardFilters.privateWaterfrontAccess: true if user wants private access to the waterfront (private dock, private beach, private path) — not shared with neighbors
- hardFilters.minFullBaths: minimum full bathrooms (half-baths don't count)
- hardFilters.maxMinutesToTown: max minutes from town. "10 min from town/city" → 10.
- hardFilters.noCouchBeds, noBunkBeds: true if user explicitly excludes
- hardFilters.renovatedOnly: true if user says renovated/modern/updated
- hardFilters.allowCouchBeds: true ONLY if user explicitly says couches/sofa beds are OK (default false)

Negation, edge cases, and shorthand are common — read carefully.

OUTPUT FORMAT: Reply with ONLY a single JSON object. No prose, no markdown, no code fences.
Include only fields the user actually mentioned. Use these field names exactly:
- Top-level: location, groupSize, pairs, minBeds, stayType, priority, budgetMin, budgetMax, budgetMode, vibes, checkIn, checkOut, flexibleDates, flexibleMonths
- hardFilters (object): noCouchBeds, noBunkBeds, minFullBaths, pool, waterfrontRequired, privateWaterfrontAccess, renovatedOnly, maxMinutesToTown, allowCouchBeds

Allowed enum values:
- stayType: "houses" | "hotels" | "both"
- priority: "value" | "location" | "vibe" | "overall"
- budgetMode: "total" | "per_person"
- vibes (array of): "lively" | "chill" | "romantic" | "family" | "adventure" | "party"
- pool (array of): "indoor" | "outdoor_in_ground" | "outdoor_above_ground" | "shared"

Return {} if you can't extract anything.`;

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured. Add it to .env.local." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text =
    body && typeof body === "object" && "text" in body
      ? (body as { text: unknown }).text
      : null;
  if (typeof text !== "string" || text.trim().length === 0) {
    return Response.json(
      { error: "Missing or empty `text` field" },
      { status: 400 },
    );
  }

  try {
    const response = await getClient().messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: text }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json(
        { error: "No text response from Claude" },
        { status: 502 },
      );
    }

    const raw = textBlock.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return Response.json(
        { error: "Could not parse JSON from Claude — try rephrasing" },
        { status: 422 },
      );
    }

    const validated = ParsedTripSchema.safeParse(json);
    if (!validated.success) {
      return Response.json(
        { error: "Claude returned an unexpected shape — try rephrasing" },
        { status: 422 },
      );
    }

    return Response.json(validated.data);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json(
        { error: "Rate limited — try again in a moment" },
        { status: 429 },
      );
    }
    if (err instanceof Anthropic.APIError) {
      return Response.json(
        { error: `Claude API error: ${err.message}` },
        { status: err.status ?? 500 },
      );
    }
    return Response.json(
      { error: "Unexpected error parsing trip" },
      { status: 500 },
    );
  }
}
