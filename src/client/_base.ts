export function apiBase(): string {
  if (typeof window !== "undefined") return "";
  const base = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("EXPO_PUBLIC_API_BASE_URL is required on native");
  return base.replace(/\/$/, "");
}
