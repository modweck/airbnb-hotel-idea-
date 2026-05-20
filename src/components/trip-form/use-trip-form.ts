import { useState } from "react";
import { useRouter } from "expo-router";
import type {
  FlexibleDuration,
  HardFilters,
  PoolType,
  Vibe,
} from "@/lib/types";
import type { ParsedTrip } from "@/lib/trip-schema";
import { trackSearch } from "@/lib/analytics";
import { parseTrip } from "@/client/trip";

export type Priority = "value" | "location" | "vibe" | "overall";
export type StayType = "houses" | "hotels" | "both";
export type BudgetMode = "total" | "per_person";
export type PeoplePerRoom = 2 | 4;
/** Specific hotel star classes the user opted into. Empty = any. */
export type SelectedStars = number[];

export function useTripForm() {
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
  const [budgetMode, setBudgetMode] = useState<BudgetMode>("total");
  const [budgetMin, setBudgetMin] = useState<number | "">("");
  const [budgetMax, setBudgetMax] = useState<number | "">("");
  const [pairs, setPairs] = useState<number | "">(0);
  const [minBeds, setMinBeds] = useState<number | "">("");
  const [distanceTo, setDistanceTo] = useState("");
  const [stayType, setStayType] = useState<StayType>("both");
  const [selectedStars, setSelectedStars] = useState<SelectedStars>([]);
  function toggleStar(star: number) {
    setSelectedStars((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star].sort(),
    );
  }
  const [peoplePerRoom, setPeoplePerRoom] = useState<PeoplePerRoom>(4);
  const [priority, setPriority] = useState<Priority>("value");
  const [vibes, setVibes] = useState<Vibe[]>([]);

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
    allowCouchBeds: false,
  });

  const suggestedMinBeds =
    typeof groupSize === "number" && groupSize > 0
      ? Math.max(1, groupSize - (typeof pairs === "number" ? pairs : 0))
      : null;

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
    if (
      parsed.flexibleMonths !== undefined &&
      parsed.flexibleMonths.length > 0
    ) {
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
        pool: current.includes(p)
          ? current.filter((x) => x !== p)
          : [...current, p],
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
      if (flexibleMonths.length)
        params.set("flexMonths", flexibleMonths.join(","));
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
    if (budgetMin !== "" || budgetMax !== "")
      params.set("budgetMode", budgetMode);
    if (vibes.length) params.set("vibes", vibes.join(","));
    if (selectedStars.length > 0)
      params.set("stars", selectedStars.join(","));
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

  return {
    // AI parser
    aiText, setAiText,
    aiLoading,
    aiError,
    aiAppliedKeys,
    handleParseWithAI,

    // Where & when
    location, setLocation,
    distanceTo, setDistanceTo,
    checkIn, setCheckIn,
    checkOut, setCheckOut,
    flexibleDates, setFlexibleDates,
    flexibleDuration, setFlexibleDuration,
    mustIncludeWeekend, setMustIncludeWeekend,
    flexibleMonths, toggleMonth,

    // Who & budget
    groupSize, setGroupSize,
    pairs, setPairs,
    minBeds, setMinBeds,
    suggestedMinBeds,
    budgetMode, setBudgetMode,
    budgetMin, setBudgetMin,
    budgetMax, setBudgetMax,
    budgetPreview,
    stayType, setStayType,

    // Hotel-specific
    selectedStars, toggleStar,
    peoplePerRoom, setPeoplePerRoom,

    // Priority & vibe
    priority, setPriority,
    vibes, setVibes,

    // Advanced filters
    showAdvanced, setShowAdvanced,
    filters, setFilters,
    togglePool,

    // Submit
    submitting,
    submitDisabled,
    handleSubmit,
  };
}

export type TripFormState = ReturnType<typeof useTripForm>;
