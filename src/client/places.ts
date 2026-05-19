import { apiBase } from "./_base";

export async function autocompletePlaces(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `${apiBase()}/api/places-autocomplete?q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as string[]) : [];
}
