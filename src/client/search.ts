import { apiBase } from "./_base";
import type { SearchTripInput, SearchTripResult } from "@/server/search/pipeline";

export async function searchTripApi(input: SearchTripInput): Promise<SearchTripResult> {
  const res = await fetch(`${apiBase()}/api/search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`search ${res.status}`);
  return res.json();
}
