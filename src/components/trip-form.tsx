import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import type {
  Vibe,
  PoolType,
  HardFilters,
  FlexibleDuration,
} from "@/lib/types";
import type { ParsedTrip } from "@/lib/trip-schema";
import { trackSearch } from "@/lib/analytics";
import { parseTrip } from "@/client/trip";
import { PlaceAutocomplete } from "@/components/place-autocomplete";
import {
  Checkbox,
  DURATIONS,
  POOL_TYPES,
  VIBES,
  nextTwelveMonths,
  parseDigits,
} from "@/components/trip-form/shared";

export function TripForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // AI freeform parser
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAppliedKeys, setAiAppliedKeys] = useState<string[]>([]);

  // Core inputs
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [flexibleDuration, setFlexibleDuration] =
    useState<FlexibleDuration | null>(null);
  const [mustIncludeWeekend, setMustIncludeWeekend] = useState(false);
  const [flexibleMonths, setFlexibleMonths] = useState<string[]>([]);
  const [groupSize, setGroupSize] = useState<number | "">(8);
  const [budgetMode, setBudgetMode] = useState<"total" | "per_person">("total");
  const [budgetMin, setBudgetMin] = useState<number | "">("");
  const [budgetMax, setBudgetMax] = useState<number | "">("");
  const [pairs, setPairs] = useState<number | "">(0);
  const [minBeds, setMinBeds] = useState<number | "">("");
  const [distanceTo, setDistanceTo] = useState("");
  const [stayType, setStayType] = useState<"houses" | "hotels" | "both">("both");
  const [minStars, setMinStars] = useState<number | "">("");
  const [peoplePerRoom, setPeoplePerRoom] = useState<2 | 4>(4);
  const [priority, setPriority] = useState<
    "value" | "location" | "vibe" | "overall"
  >("value");

  const suggestedMinBeds =
    typeof groupSize === "number" && groupSize > 0
      ? Math.max(1, groupSize - (typeof pairs === "number" ? pairs : 0))
      : null;
  const [vibes, setVibes] = useState<Vibe[]>([]);

  const budgetPreview = (() => {
    if (typeof groupSize !== "number" || groupSize <= 0) return null;
    const min = typeof budgetMin === "number" ? budgetMin : null;
    const max = typeof budgetMax === "number" ? budgetMax : null;
    if (min === null && max === null) return null;
    const fmt = (n: number) =>
      n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
    const convert = (n: number) =>
      budgetMode === "per_person" ? n * groupSize : n / groupSize;
    const altLabel = budgetMode === "per_person" ? "total" : "per person";
    if (min !== null && max !== null) {
      return `${fmt(convert(min))}–${fmt(convert(max))} ${altLabel}`;
    }
    if (max !== null) return `${fmt(convert(max))} ${altLabel} max`;
    return `${fmt(convert(min!))} ${altLabel} min`;
  })();

  // Hard filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<HardFilters>({
    noCouchBeds: false,
    noBunkBeds: false,
    minFullBaths: undefined,
    pool: [],
    waterfrontRequired: false,
    privateWaterfrontAccess: false,
    renovatedOnly: false,
    maxMinutesToTown: undefined,
    allowCouchBeds: false,
  });

  function applyParsed(parsed: ParsedTrip) {
    const applied: string[] = [];
    if (parsed.location !== undefined) {
      setLocation(parsed.location);
      applied.push("location");
    }
    if (parsed.groupSize !== undefined) {
      setGroupSize(parsed.groupSize);
      applied.push("group size");
    }
    if (parsed.pairs !== undefined) {
      setPairs(parsed.pairs);
      applied.push(`${parsed.pairs} pairs`);
    }
    if (parsed.minBeds !== undefined) {
      setMinBeds(parsed.minBeds);
      applied.push("min beds");
    }
    if (parsed.stayType !== undefined) {
      setStayType(parsed.stayType);
      applied.push("stay type");
    }
    if (parsed.priority !== undefined) {
      setPriority(parsed.priority);
      applied.push("priority");
    }
    if (parsed.budgetMin !== undefined) {
      setBudgetMin(parsed.budgetMin);
      applied.push("budget min");
    }
    if (parsed.budgetMax !== undefined) {
      setBudgetMax(parsed.budgetMax);
      applied.push("budget max");
    }
    if (parsed.budgetMode !== undefined) setBudgetMode(parsed.budgetMode);
    if (parsed.vibes !== undefined && parsed.vibes.length > 0) {
      setVibes(parsed.vibes);
      applied.push("vibes");
    }
    if (parsed.checkIn !== undefined) {
      setCheckIn(parsed.checkIn);
      applied.push("check-in");
    }
    if (parsed.checkOut !== undefined) {
      setCheckOut(parsed.checkOut);
      applied.push("check-out");
    }
    if (parsed.flexibleDates !== undefined) {
      setFlexibleDates(parsed.flexibleDates);
      if (parsed.flexibleDates) applied.push("flexible dates");
    }
    if (parsed.flexibleMonths !== undefined && parsed.flexibleMonths.length > 0) {
      setFlexibleMonths(parsed.flexibleMonths);
      applied.push("months");
    }
    if (parsed.hardFilters) {
      setFilters((prev) => ({ ...prev, ...parsed.hardFilters }));
      applied.push("filters");
    }
    setAiAppliedKeys(applied);
  }

  async function handleParseWithAI() {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiAppliedKeys([]);
    try {
      const parsed = await parseTrip(aiText);
      applyParsed(parsed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not parse";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  }

  function toggleMonth(key: string) {
    setFlexibleMonths((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key],
    );
  }

  function togglePool(p: PoolType) {
    setFilters((prev) => {
      const current = prev.pool ?? [];
      return {
        ...prev,
        pool: current.includes(p) ? current.filter((x) => x !== p) : [...current, p],
      };
    });
  }

  function handleSubmit() {
    if (!location || !groupSize) return;

    setSubmitting(true);
    const params = new URLSearchParams();
    params.set("location", location);
    if (flexibleDates) {
      params.set("flexible", "1");
      if (flexibleDuration) params.set("flexDuration", flexibleDuration);
      if (mustIncludeWeekend) params.set("flexWeekend", "1");
      if (flexibleMonths.length) params.set("flexMonths", flexibleMonths.join(","));
    } else {
      if (checkIn) params.set("checkIn", checkIn);
      if (checkOut) params.set("checkOut", checkOut);
    }
    params.set("groupSize", String(groupSize));
    if (pairs !== "" && Number(pairs) > 0) params.set("pairs", String(pairs));
    const effectiveMinBeds =
      minBeds !== "" ? Number(minBeds) : suggestedMinBeds;
    if (effectiveMinBeds) params.set("minBeds", String(effectiveMinBeds));
    if (stayType !== "both") params.set("stayType", stayType);
    if (priority !== "value") params.set("priority", priority);
    if (budgetMin !== "") params.set("budgetMin", String(budgetMin));
    if (budgetMax !== "") params.set("budgetMax", String(budgetMax));
    if (budgetMin !== "" || budgetMax !== "") params.set("budgetMode", budgetMode);
    if (vibes.length) params.set("vibes", vibes.join(","));
    if (minStars !== "") params.set("minStars", String(minStars));
    params.set("peoplePerRoom", String(peoplePerRoom));
    if (distanceTo.trim()) params.set("distanceTo", distanceTo.trim());
    params.set("filters", encodeURIComponent(JSON.stringify(filters)));

    trackSearch({
      location,
      groupSize: Number(groupSize),
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      budgetMode: budgetMin !== "" || budgetMax !== "" ? budgetMode : undefined,
      budgetMin: budgetMin !== "" ? Number(budgetMin) : undefined,
      budgetMax: budgetMax !== "" ? Number(budgetMax) : undefined,
    });

    router.push(`/results?${params.toString()}` as never);
  }

  const submitDisabled = submitting || !location || !groupSize;

  return (
    <View className="space-y-8">
      {/* AI freeform parser */}
      <View className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <View className="mb-2 flex-row items-center gap-2">
          <View className="rounded-full bg-zinc-900 px-1.5 py-0.5 dark:bg-white">
            <Text className="text-[10px] font-bold uppercase text-white dark:text-zinc-900">
              AI
            </Text>
          </View>
          <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Describe your trip — I&apos;ll fill the form
          </Text>
        </View>
        <TextInput
          value={aiText}
          onChangeText={setAiText}
          placeholder="e.g. 4 bedroom house, 5 beds, 10 min from town, real outdoor in-ground pool, no indoor or above ground, 8 people, $4-6k total, chill vibe"
          multiline
          numberOfLines={3}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <View className="mt-2 flex-row items-center justify-between gap-2">
          <View className="flex-1">
            {aiError && (
              <Text className="text-xs text-red-600 dark:text-red-400">
                {aiError}
              </Text>
            )}
            {aiAppliedKeys.length > 0 && !aiError && (
              <Text className="text-xs text-emerald-700 dark:text-emerald-400">
                ✓ Applied: {aiAppliedKeys.join(", ")}
              </Text>
            )}
          </View>
          <Pressable
            onPress={handleParseWithAI}
            disabled={aiLoading || !aiText.trim()}
            className={`rounded-lg px-4 py-2 ${
              aiLoading || !aiText.trim()
                ? "bg-zinc-300 dark:bg-zinc-700"
                : "bg-zinc-900 dark:bg-white"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                aiLoading || !aiText.trim()
                  ? "text-zinc-500"
                  : "text-white dark:text-zinc-900"
              }`}
            >
              {aiLoading ? "Parsing…" : "Parse with AI"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <Text className="text-xs uppercase tracking-wider text-zinc-400">
          or fill in manually
        </Text>
        <View className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </View>

      {/* Where & when */}
      <View className="space-y-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Where & when
          </Text>
          <Link href={"/saved" as never} asChild>
            <Pressable className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800">
              <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Saved
              </Text>
            </Pressable>
          </Link>
        </View>
        <View>
          <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Location
          </Text>
          <PlaceAutocomplete
            placeholder="e.g. Lake Tahoe, Miami, Aspen"
            value={location}
            onChange={setLocation}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
        </View>

        <View>
          <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Distance to (optional)
          </Text>
          <PlaceAutocomplete
            placeholder="e.g. South Beach, Times Square, 123 Ocean Dr"
            value={distanceTo}
            onChange={setDistanceTo}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
          <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            We&apos;ll show how far each listing is from this place
          </Text>
        </View>

        {/* Toggle between exact dates and flexible-dates picker */}
        <View className="flex-row self-start rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <Pressable
            onPress={() => setFlexibleDates(false)}
            className={`rounded-md px-3 py-1.5 ${
              !flexibleDates
                ? "bg-white shadow-sm dark:bg-zinc-800"
                : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                !flexibleDates
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500"
              }`}
            >
              Exact dates
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFlexibleDates(true)}
            className={`rounded-md px-3 py-1.5 ${
              flexibleDates
                ? "bg-white shadow-sm dark:bg-zinc-800"
                : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                flexibleDates
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500"
              }`}
            >
              I&apos;m flexible
            </Text>
          </Pressable>
        </View>

        {!flexibleDates ? (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Check-in
              </Text>
              <TextInput
                value={checkIn}
                onChangeText={setCheckIn}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                autoCorrect={false}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Check-out
              </Text>
              <TextInput
                value={checkOut}
                onChangeText={setCheckOut}
                placeholder="YYYY-MM-DD"
                autoCapitalize="none"
                autoCorrect={false}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
              />
            </View>
          </View>
        ) : (
          <View className="space-y-5 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            {/* Duration */}
            <View>
              <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                How long do you want to stay?
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {DURATIONS.map((d) => {
                  const active = flexibleDuration === d.id;
                  return (
                    <Pressable
                      key={d.id}
                      onPress={() =>
                        setFlexibleDuration(active ? null : d.id)
                      }
                      className={`rounded-full border px-4 py-2 ${
                        active
                          ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                          : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          active
                            ? "text-white dark:text-zinc-900"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Checkbox
              checked={mustIncludeWeekend}
              onChange={setMustIncludeWeekend}
              label="Must include a weekend"
            />

            {/* Months */}
            <View>
              <Text className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                When do you want to travel?
              </Text>
              <Text className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                Pick one or more months.
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {nextTwelveMonths().map((m) => {
                  const active = flexibleMonths.includes(m.key);
                  return (
                    <Pressable
                      key={m.key}
                      onPress={() => toggleMonth(m.key)}
                      className={`w-[30%] items-center rounded-lg border px-3 py-3 sm:w-[22%] ${
                        active
                          ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                          : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          active
                            ? "text-white dark:text-zinc-900"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {m.monthLabel}
                      </Text>
                      <Text
                        className={`text-xs ${
                          active
                            ? "text-white/70 dark:text-zinc-900/70"
                            : "text-zinc-500"
                        }`}
                      >
                        {m.year}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Who & how much */}
      <View className="space-y-4">
        <Text className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Who & how much
        </Text>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Group size
            </Text>
            <TextInput
              keyboardType="number-pad"
              value={String(groupSize)}
              onChangeText={(t) => setGroupSize(parseDigits(t))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Sharing
            </Text>
            <TextInput
              keyboardType="number-pad"
              value={String(pairs)}
              onChangeText={(t) => setPairs(parseDigits(t))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Min beds
            </Text>
            <TextInput
              keyboardType="number-pad"
              placeholder={suggestedMinBeds ? `Auto: ${suggestedMinBeds}` : "Auto"}
              value={String(minBeds)}
              onChangeText={(t) => setMinBeds(parseDigits(t))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
            />
          </View>
        </View>
        <Text className="text-xs text-zinc-500 dark:text-zinc-400">
          Pairs sharing = how many will share a bed (queen / king / double).
          Everyone else gets their own bed (any size). No couches.
        </Text>

        <View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Budget range
            </Text>
            <View className="flex-row rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              <Pressable
                onPress={() => setBudgetMode("total")}
                className={`rounded-md px-2.5 py-1 ${
                  budgetMode === "total"
                    ? "bg-white shadow-sm dark:bg-zinc-800"
                    : ""
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    budgetMode === "total"
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-500"
                  }`}
                >
                  Total
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setBudgetMode("per_person")}
                className={`rounded-md px-2.5 py-1 ${
                  budgetMode === "per_person"
                    ? "bg-white shadow-sm dark:bg-zinc-800"
                    : ""
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    budgetMode === "per_person"
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-500"
                  }`}
                >
                  Per person
                </Text>
              </Pressable>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-900">
            <Text className="text-sm text-zinc-400">$</Text>
            <TextInput
              keyboardType="number-pad"
              placeholder="Min"
              accessibilityLabel="Minimum budget"
              value={String(budgetMin)}
              onChangeText={(t) => setBudgetMin(parseDigits(t))}
              className="flex-1 bg-transparent py-3 text-base"
            />
            <Text className="text-zinc-400">–</Text>
            <TextInput
              keyboardType="number-pad"
              placeholder="Max"
              accessibilityLabel="Maximum budget"
              value={String(budgetMax)}
              onChangeText={(t) => setBudgetMax(parseDigits(t))}
              className="flex-1 bg-transparent py-3 text-base"
            />
          </View>
          {budgetPreview && (
            <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              = {budgetPreview}
            </Text>
          )}
        </View>

        {/* Stay type */}
        <View>
          <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Stay type
          </Text>
          <View className="flex-row gap-2">
            {(
              [
                { id: "both", label: "🔀 Both", sub: "Houses + Hotels" },
                { id: "houses", label: "🏠 Houses", sub: "VRBO" },
                { id: "hotels", label: "🏨 Hotels", sub: "Booking" },
              ] as const
            ).map((s) => {
              const active = stayType === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setStayType(s.id)}
                  className={`flex-1 rounded-lg border px-3 py-2 ${
                    active
                      ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                      : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      active
                        ? "text-white dark:text-zinc-900"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {s.label}
                  </Text>
                  <Text
                    className={`text-xs ${
                      active
                        ? "text-white/70 dark:text-zinc-900/70"
                        : "text-zinc-500"
                    }`}
                  >
                    {s.sub}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Hotel-specific: Star rating + Room occupancy */}
      {(stayType === "hotels" || stayType === "both") && (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Min star rating
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {(
                [
                  { val: "" as const, label: "Any" },
                  { val: 2 as const, label: "2+" },
                  { val: 3 as const, label: "3+" },
                  { val: 4 as const, label: "4+" },
                  { val: 5 as const, label: "5" },
                ]
              ).map((opt) => {
                const active = minStars === opt.val;
                return (
                  <Pressable
                    key={String(opt.val)}
                    onPress={() => setMinStars(opt.val)}
                    className={`rounded-md border px-3 py-2 ${
                      active
                        ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                        : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        active
                          ? "text-white dark:text-zinc-900"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              People per room
            </Text>
            <View className="flex-row gap-2">
              {(
                [
                  { val: 2 as const, label: "2", sub: "Own bed" },
                  { val: 4 as const, label: "4", sub: "Share beds" },
                ]
              ).map((opt) => {
                const active = peoplePerRoom === opt.val;
                return (
                  <Pressable
                    key={opt.val}
                    onPress={() => setPeoplePerRoom(opt.val)}
                    className={`flex-1 rounded-lg border px-3 py-2 ${
                      active
                        ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                        : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        active
                          ? "text-white dark:text-zinc-900"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {opt.label}/room
                    </Text>
                    <Text
                      className={`text-xs ${
                        active
                          ? "text-white/70 dark:text-zinc-900/70"
                          : "text-zinc-500"
                      }`}
                    >
                      {opt.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* What matters most? */}
      <View className="space-y-3">
        <Text className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          What matters most?
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(
            [
              { id: "value", label: "💰 Best value" },
              { id: "location", label: "📍 Best location" },
              { id: "vibe", label: "🎉 Best vibe" },
              { id: "overall", label: "🏆 Best overall" },
            ] as const
          ).map((p) => {
            const active = priority === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPriority(p.id)}
                className={`flex-1 rounded-lg border px-3 py-3 ${
                  active
                    ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                    : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              >
                <Text
                  className={`text-center text-sm font-medium ${
                    active
                      ? "text-white dark:text-zinc-900"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Vibe */}
      <View className="space-y-3">
        <Text className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Area vibe
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => setVibes([])}
            className={`rounded-full px-4 py-2 ${
              vibes.length === 0
                ? "bg-zinc-900 dark:bg-white"
                : "bg-zinc-100 dark:bg-zinc-800"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                vibes.length === 0
                  ? "text-white dark:text-zinc-900"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              Any
            </Text>
          </Pressable>
          {VIBES.map((v) => {
            const active = vibes.includes(v.id);
            return (
              <Pressable
                key={v.id}
                onPress={() => setVibes([v.id])}
                className={`rounded-full px-4 py-2 ${
                  active
                    ? "bg-zinc-900 dark:bg-white"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    active
                      ? "text-white dark:text-zinc-900"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {v.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Advanced — hard filters */}
      <View className="space-y-3">
        <Pressable onPress={() => setShowAdvanced((v) => !v)}>
          <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {showAdvanced ? "− Hide" : "+ Advanced filters"}
          </Text>
        </Pressable>

        {showAdvanced && (
          <View className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <Checkbox
              checked={filters.allowCouchBeds ?? false}
              onChange={(v) => setFilters({ ...filters, allowCouchBeds: v })}
              label="Allow couch beds to count"
              hint="(off by default — bed truth)"
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Min full bathrooms
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  value={filters.minFullBaths === undefined ? "" : String(filters.minFullBaths)}
                  onChangeText={(t) => {
                    const v = parseDigits(t);
                    setFilters({
                      ...filters,
                      minFullBaths: v === "" ? undefined : v,
                    });
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Max minutes to town
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  value={filters.maxMinutesToTown === undefined ? "" : String(filters.maxMinutesToTown)}
                  onChangeText={(t) => {
                    const v = parseDigits(t);
                    setFilters({
                      ...filters,
                      maxMinutesToTown: v === "" ? undefined : v,
                    });
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Pool requirements
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {POOL_TYPES.map((p) => {
                  const active = (filters.pool ?? []).includes(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => togglePool(p.id)}
                      className={`rounded-full px-3 py-1.5 ${
                        active
                          ? "bg-zinc-900 dark:bg-white"
                          : "bg-zinc-100 dark:bg-zinc-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          active
                            ? "text-white dark:text-zinc-900"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="space-y-2">
              <Checkbox
                checked={filters.waterfrontRequired ?? false}
                onChange={(v) => setFilters({ ...filters, waterfrontRequired: v })}
                label="Real waterfront only"
              />
              <Checkbox
                checked={filters.privateWaterfrontAccess ?? false}
                onChange={(v) => setFilters({ ...filters, privateWaterfrontAccess: v })}
                label="Private access to waterfront"
              />
              <Checkbox
                checked={filters.noCouchBeds ?? false}
                onChange={(v) => setFilters({ ...filters, noCouchBeds: v })}
                label="No couch beds"
              />
              <Checkbox
                checked={filters.noBunkBeds ?? false}
                onChange={(v) => setFilters({ ...filters, noBunkBeds: v })}
                label="No bunk beds"
              />
              <Checkbox
                checked={filters.renovatedOnly ?? false}
                onChange={(v) => setFilters({ ...filters, renovatedOnly: v })}
                label="Renovated only"
              />
            </View>
          </View>
        )}
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={submitDisabled}
        className={`w-full rounded-lg px-6 py-4 ${
          submitDisabled
            ? "bg-zinc-300 dark:bg-zinc-700"
            : "bg-zinc-900 dark:bg-white"
        }`}
      >
        <Text
          className={`text-center text-base font-semibold ${
            submitDisabled
              ? "text-zinc-500"
              : "text-white dark:text-zinc-900"
          }`}
        >
          {submitting ? "Searching…" : "Find the best options"}
        </Text>
      </Pressable>
    </View>
  );
}
