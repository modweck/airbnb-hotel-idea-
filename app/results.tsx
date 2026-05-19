import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { SortableListings } from "@/components/sortable-listings";
import { searchTripApi } from "@/client/search";
import type {
  SearchTripInput,
  SearchTripResult,
} from "@/server/search/pipeline";

function parseNumber(s: string | string[] | undefined): number | undefined {
  if (s === undefined || s === "") return undefined;
  const v = Array.isArray(s) ? s[0] : s;
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function getString(s: string | string[] | undefined): string {
  if (s === undefined) return "";
  return Array.isArray(s) ? (s[0] ?? "") : s;
}

export default function ResultsPage() {
  const params = useLocalSearchParams();

  const location = getString(params.location);
  const groupSize = parseNumber(params.groupSize) ?? 0;
  const checkIn = getString(params.checkIn);
  const checkOut = getString(params.checkOut);
  const flexible = getString(params.flexible) === "1";
  const flexDuration = getString(params.flexDuration);
  const flexWeekend = getString(params.flexWeekend) === "1";
  const flexMonths = getString(params.flexMonths).split(",").filter(Boolean);
  const budgetMin = parseNumber(params.budgetMin);
  const budgetMax = parseNumber(params.budgetMax);
  const budgetMode: "total" | "per_person" =
    getString(params.budgetMode) === "per_person" ? "per_person" : "total";
  const budgetModeLabel =
    budgetMode === "per_person" ? "per person" : "total";
  const minBeds = parseNumber(params.minBeds);
  const minBathrooms = parseNumber(params.minBathrooms);
  const pairs = parseNumber(params.pairs) ?? 0;
  const stayType = (getString(params.stayType) || "both") as
    | "houses"
    | "hotels"
    | "both";
  const priority = getString(params.priority) || "value";
  const vibes = getString(params.vibes).split(",").filter(Boolean);
  const distanceTo = getString(params.distanceTo);

  const [data, setData] = useState<SearchTripResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Stable cache key for the effect — re-fetch when any input changes.
  const cacheKey = JSON.stringify({
    location,
    checkIn,
    checkOut,
    groupSize,
    pairs,
    stayType,
    minBeds,
    minBathrooms,
    budgetMin,
    budgetMax,
    budgetMode,
    vibes,
    distanceTo,
  });

  useEffect(() => {
    let cancelled = false;
    const input: SearchTripInput = {
      location,
      checkIn,
      checkOut,
      groupSize,
      pairs,
      stayType,
      minBeds,
      minBathrooms,
      budgetMin,
      budgetMax,
      budgetMode,
      vibes,
      distanceTo: distanceTo || undefined,
    };

    // Fetching on URL change is the canonical effect use-case — the lint rule
    // flags the synchronous setState but there's no external sync state to
    // derive loading from without bigger machinery (SWR/Query).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    searchTripApi(input)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Search failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const matched = data?.matched ?? [];
  const overflow = data?.overflow ?? [];
  const meta = data?.meta ?? null;
  const needsLiveQuery = meta?.needsLiveQuery ?? true;
  const hasRequiredParams = meta?.hasRequiredParams ?? false;
  const providerName = meta?.providerName ?? "unknown";
  const totalShown = matched.length + overflow.length;

  const summaryLine =
    (groupSize > 0 ? `${groupSize} people` : "") +
    (flexible
      ? ` · flexible${flexDuration ? ` (${flexDuration})` : ""}${
          flexMonths.length ? ` in ${flexMonths.join(", ")}` : ""
        }${flexWeekend ? " · weekend" : ""}`
      : checkIn && checkOut
        ? ` · ${checkIn} → ${checkOut}`
        : "") +
    (pairs > 0 ? ` · ${pairs} pair${pairs === 1 ? "" : "s"} sharing` : "") +
    (minBeds ? ` · ${minBeds}+ beds` : "") +
    (budgetMin !== undefined || budgetMax !== undefined
      ? ` · $${budgetMin ?? "0"}–${budgetMax ?? "∞"} ${budgetModeLabel}`
      : "") +
    (stayType !== "both" ? ` · ${stayType} only` : "") +
    ` · sorted by ${priority}` +
    (vibes.length > 0 ? ` · ${vibes.join(", ")}` : "");

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-950"
      contentContainerClassName="mx-auto w-full max-w-3xl px-6 py-10"
    >
      <Link href={"/" as never} asChild>
        <Pressable className="mb-6">
          <Text className="text-sm text-zinc-600 dark:text-zinc-400">
            ← New search
          </Text>
        </Pressable>
      </Link>

      <View className="mb-8 space-y-1">
        <Text className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          {location || "Your trip"}
        </Text>
        <Text className="text-sm text-zinc-600 dark:text-zinc-400">
          {summaryLine}
        </Text>
        <Text className="text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
          source: {providerName}
        </Text>
      </View>

      {loading && (
        <View className="items-center py-10">
          <ActivityIndicator />
          <Text className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Searching…
          </Text>
        </View>
      )}

      {!loading && error && (
        <View className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <Text className="text-sm text-red-700 dark:text-red-400">
            {error}
          </Text>
        </View>
      )}

      {!loading && !error && needsLiveQuery && !hasRequiredParams && (
        <View className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 dark:border-zinc-700 dark:bg-zinc-900">
          <Text className="text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Missing search details.
          </Text>
          <Text className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Location, check-in, and check-out dates are required.
          </Text>
        </View>
      )}

      {!loading &&
        !error &&
        hasRequiredParams &&
        (totalShown === 0 ? (
          <EmptyState
            budgetMax={budgetMax}
            budgetModeLabel={budgetModeLabel}
          />
        ) : (
          <SortableListings
            matched={matched}
            overflow={overflow}
            groupSize={groupSize}
            budgetMode={budgetMode}
            hasDistance={!!distanceTo}
          />
        ))}
    </ScrollView>
  );
}

function EmptyState({
  budgetMax,
  budgetModeLabel,
}: {
  budgetMax: number | undefined;
  budgetModeLabel: string;
}) {
  return (
    <View className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 dark:border-zinc-700 dark:bg-zinc-900">
      <Text className="text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
        No listings within reach of your budget.
      </Text>
      <Text className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
        {budgetMax !== undefined
          ? `Even relaxing the $${budgetMax} ${budgetModeLabel} ceiling by 15% didn't surface anything.`
          : "Try widening your search and trying again."}
      </Text>
      <Link href={"/" as never} asChild>
        <Pressable className="mt-4 self-center rounded-md bg-zinc-900 px-4 py-2 dark:bg-white">
          <Text className="text-sm font-medium text-white dark:text-zinc-900">
            Adjust search
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

