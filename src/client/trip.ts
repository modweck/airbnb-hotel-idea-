import { apiBase } from "./_base";
import type { ParsedTrip } from "@/lib/trip-schema";

export async function parseTrip(text: string): Promise<ParsedTrip> {
  const res = await fetch(`${apiBase()}/api/parse-trip`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`parseTrip ${res.status}`);
  return res.json();
}
