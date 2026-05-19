import { Pressable, Text, View } from "react-native";
import type { FlexibleDuration, PoolType, Vibe } from "@/lib/types";

export const VIBES: { id: Vibe; label: string }[] = [
  { id: "lively", label: "Lively" },
  { id: "chill", label: "Moderate" },
  { id: "adventure", label: "Quiet" },
];

export const POOL_TYPES: { id: PoolType; label: string }[] = [
  { id: "outdoor_in_ground", label: "Outdoor in-ground" },
  { id: "outdoor_above_ground", label: "Outdoor above-ground" },
  { id: "indoor", label: "Indoor" },
];

export const DURATIONS: { id: FlexibleDuration; label: string }[] = [
  { id: "1n", label: "1 night" },
  { id: "2-3n", label: "2–3 nights" },
  { id: "4-5n", label: "4–5 nights" },
  { id: "1w", label: "1 week" },
  { id: "2w", label: "2 weeks" },
  { id: "1mo", label: "1 month" },
];

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function nextTwelveMonths() {
  const now = new Date();
  const out: { key: string; monthLabel: string; year: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      monthLabel: MONTH_NAMES[d.getMonth()],
      year: d.getFullYear(),
    });
  }
  return out;
}

// Strip non-digits from a typed string. Used by every numeric input.
export function parseDigits(s: string): number | "" {
  const digits = s.replace(/[^0-9]/g, "");
  return digits === "" ? "" : Number(digits);
}

// Cross-platform checkbox: Pressable with a ✓ when active.
export function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      className="flex-row items-center gap-2"
    >
      <View
        className={`h-4 w-4 items-center justify-center rounded border ${
          checked
            ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
            : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        }`}
      >
        {checked && (
          <Text className="text-[10px] font-bold text-white dark:text-zinc-900">
            ✓
          </Text>
        )}
      </View>
      <Text className="text-sm text-zinc-900 dark:text-zinc-100">{label}</Text>
      {hint && (
        <Text className="text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </Text>
      )}
    </Pressable>
  );
}
