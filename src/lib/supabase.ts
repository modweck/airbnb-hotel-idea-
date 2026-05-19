import { createClient } from "@supabase/supabase-js";
import { kvStore } from "./kv-store";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error(
    "Supabase env vars missing: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY",
  );
}

export const supabase = createClient(url, anon, {
  auth: {
    storage: {
      getItem: (k) => kvStore.getItem(k),
      setItem: (k, v) => kvStore.setItem(k, v),
      removeItem: (k) => kvStore.removeItem(k),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== "undefined",
  },
});
