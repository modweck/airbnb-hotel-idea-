"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Vibe,
  PoolType,
  HardFilters,
  FlexibleDuration,
} from "@/lib/types";
import type { ParsedTrip } from "@/lib/trip-schema";
import { trackSearch } from "@/lib/analytics";
import { PlaceAutocomplete } from "@/components/place-autocomplete";

const VIBES: { id: Vibe; label: string }[] = [
  { id: "lively", label: "Lively" },
  { id: "chill", label: "Moderate" },
  { id: "adventure", label: "Quiet" },
];

const POOL_TYPES: { id: PoolType; label: string }[] = [
  { id: "outdoor_in_ground", label: "Outdoor in-ground" },
  { id: "outdoor_above_ground", label: "Outdoor above-ground" },
  { id: "indoor", label: "Indoor" },
];

const DURATIONS: { id: FlexibleDuration; label: string }[] = [
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

function nextTwelveMonths() {
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

// Strip non-digits from a typed string. Used by every numeric-style input —
// see comment on the inputs themselves for why we use type="text" instead of
// type="number".
function parseDigits(s: string): number | "" {
  const digits = s.replace(/[^0-9]/g, "");
  return digits === "" ? "" : Number(digits);
}

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
  // (Above renames couples → pairs; UI label uses "Sharing")
  const [minBeds, setMinBeds] = useState<number | "">("");
  const [distanceTo, setDistanceTo] = useState("");
  const [stayType, setStayType] = useState<"houses" | "hotels" | "both">("both");
  const [minStars, setMinStars] = useState<number | "">("");
  const [peoplePerRoom, setPeoplePerRoom] = useState<2 | 4>(4);
  const [priority, setPriority] = useState<
    "value" | "location" | "vibe" | "overall"
  >("value");

  // Bed truth: 1 bed per couple + 1 bed per single = groupSize - pairs.
  const suggestedMinBeds =
    typeof groupSize === "number" && groupSize > 0
      ? Math.max(1, groupSize - (typeof pairs === "number" ? pairs : 0))
      : null;
  const [vibes, setVibes] = useState<Vibe[]>([]);

  // Live preview: convert what the user typed into the alternate view.
  // "$500 per person" with group of 4 → "$2,000 total".
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
      const res = await fetch("/api/parse-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error ?? "Could not parse");
      } else {
        applyParsed(data as ParsedTrip);
      }
    } catch {
      setAiError("Network error — please try again");
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

    router.push(`/results?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* AI freeform parser — type a description, let Claude fill the form */}
      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <label htmlFor="aiText" className="mb-2 flex items-center gap-2 text-sm font-medium">
          <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white dark:bg-white dark:text-zinc-900">
            AI
          </span>
          Describe your trip — I&apos;ll fill the form
        </label>
        <textarea
          id="aiText"
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          placeholder="e.g. 4 bedroom house, 5 beds, 10 min from town, real outdoor in-ground pool, no indoor or above ground, 8 people, $4-6k total, chill vibe"
          rows={3}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex-1 text-xs">
            {aiError && <span className="text-red-600 dark:text-red-400">{aiError}</span>}
            {aiAppliedKeys.length > 0 && !aiError && (
              <span className="text-emerald-700 dark:text-emerald-400">
                ✓ Applied: {aiAppliedKeys.join(", ")}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleParseWithAI}
            disabled={aiLoading || !aiText.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {aiLoading ? "Parsing…" : "Parse with AI"}
          </button>
        </div>
      </section>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        or fill in manually
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Where & when */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Where & when</h2>
          <a
            href="/saved"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Saved
          </a>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="location">
            Location
          </label>
          <PlaceAutocomplete
            id="location"
            required
            placeholder="e.g. Lake Tahoe, Miami, Aspen"
            value={location}
            onChange={setLocation}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="distanceTo">
            Distance to (optional)
          </label>
          <PlaceAutocomplete
            id="distanceTo"
            placeholder="e.g. South Beach, Times Square, 123 Ocean Dr"
            value={distanceTo}
            onChange={setDistanceTo}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            We&apos;ll show how far each listing is from this place
          </p>
        </div>

        {/* Toggle between exact dates and flexible-dates picker */}
        <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setFlexibleDates(false)}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              !flexibleDates
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Exact dates
          </button>
          <button
            type="button"
            onClick={() => setFlexibleDates(true)}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
              flexibleDates
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            I&apos;m flexible
          </button>
        </div>

        {!flexibleDates ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="checkIn">
                Check-in
              </label>
              <input
                id="checkIn"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="checkOut">
                Check-out
              </label>
              <input
                id="checkOut"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            {/* Duration */}
            <div>
              <p className="mb-2 text-sm font-medium">How long do you want to stay?</p>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => {
                  const active = flexibleDuration === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() =>
                        setFlexibleDuration(active ? null : d.id)
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Must include weekend */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mustIncludeWeekend}
                onChange={(e) => setMustIncludeWeekend(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Must include a weekend
            </label>

            {/* Months */}
            <div>
              <p className="mb-1 text-sm font-medium">When do you want to travel?</p>
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                Pick one or more months.
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {nextTwelveMonths().map((m) => {
                  const active = flexibleMonths.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleMonth(m.key)}
                      className={`flex flex-col items-center justify-center rounded-lg border px-3 py-3 transition-colors ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="mb-1 h-5 w-5"
                      >
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path d="M3 9h18M8 3v4M16 3v4" />
                      </svg>
                      <span className="text-sm font-semibold">{m.monthLabel}</span>
                      <span className="text-xs opacity-70">{m.year}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Who & how much */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Who & how much</h2>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="groupSize">
              Group size
            </label>
            <input
              id="groupSize"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={groupSize}
              onChange={(e) => setGroupSize(parseDigits(e.target.value))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="pairs">
              Sharing
            </label>
            <input
              id="pairs"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pairs}
              onChange={(e) => setPairs(parseDigits(e.target.value))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="minBeds">
              Min beds
            </label>
            <input
              id="minBeds"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={suggestedMinBeds ? `Auto: ${suggestedMinBeds}` : "Auto"}
              value={minBeds}
              onChange={(e) => setMinBeds(parseDigits(e.target.value))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Pairs sharing = how many will share a bed (queen / king / double). Everyone else gets their own bed (any size). No couches.
        </p>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium">Budget range</label>
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setBudgetMode("total")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  budgetMode === "total"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                Total
              </button>
              <button
                type="button"
                onClick={() => setBudgetMode("per_person")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  budgetMode === "per_person"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                Per person
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-900">
            <span className="text-sm text-zinc-400">$</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Min"
              aria-label="Minimum budget"
              value={budgetMin}
              onChange={(e) => setBudgetMin(parseDigits(e.target.value))}
              className="w-full bg-transparent py-3 text-base focus:outline-none"
            />
            <span className="text-zinc-400">–</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Max"
              aria-label="Maximum budget"
              value={budgetMax}
              onChange={(e) => setBudgetMax(parseDigits(e.target.value))}
              className="w-full bg-transparent py-3 text-base focus:outline-none"
            />
          </div>
          {budgetPreview && (
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              = {budgetPreview}
            </p>
          )}
        </div>

        {/* Stay type */}
        <div>
          <label className="block text-sm font-medium mb-2">Stay type</label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "both", label: "🔀 Both", sub: "Houses + Hotels" },
                { id: "houses", label: "🏠 Houses", sub: "VRBO" },
                { id: "hotels", label: "🏨 Hotels", sub: "Booking" },
              ] as const
            ).map((s) => {
              const active = stayType === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStayType(s.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs opacity-70">{s.sub}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

        {/* Hotel-specific: Star rating + Room occupancy */}
        {(stayType === "hotels" || stayType === "both") && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Min star rating</label>
              <select
                value={minStars}
                onChange={(e) => setMinStars(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Any</option>
                <option value="2">2+ stars</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="5">5 stars</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">People per room</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { val: 2 as const, label: "2", sub: "Own bed" },
                  { val: 4 as const, label: "4", sub: "Share beds" },
                ]).map((opt) => {
                  const active = peoplePerRoom === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setPeoplePerRoom(opt.val)}
                      className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      <div className="text-sm font-semibold">{opt.label}/room</div>
                      <div className="text-xs opacity-70">{opt.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      {/* What matters most? — drives the ranking */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          What matters most?
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id)}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Vibe */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Area vibe</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setVibes([])}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              vibes.length === 0
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            Any
          </button>
          {VIBES.map((v) => {
            const active = vibes.includes(v.id);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setVibes([v.id])}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Advanced — hard filters */}
      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
        >
          {showAdvanced ? "− Hide" : "+ Advanced filters"}
        </button>

        {showAdvanced && (
          <div className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            {/* Allow couch beds — bed-truth opt-in */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.allowCouchBeds ?? false}
                onChange={(e) =>
                  setFilters({ ...filters, allowCouchBeds: e.target.checked })
                }
                className="h-4 w-4 rounded border-zinc-300"
              />
              Allow couch beds to count
              <span className="text-xs text-zinc-500">
                (off by default — bed truth)
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Min full bathrooms</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={filters.minFullBaths ?? ""}
                  onChange={(e) => {
                    const v = parseDigits(e.target.value);
                    setFilters({
                      ...filters,
                      minFullBaths: v === "" ? undefined : v,
                    });
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max minutes to town</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={filters.maxMinutesToTown ?? ""}
                  onChange={(e) => {
                    const v = parseDigits(e.target.value);
                    setFilters({
                      ...filters,
                      maxMinutesToTown: v === "" ? undefined : v,
                    });
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Pool requirements</p>
              <div className="flex flex-wrap gap-2">
                {POOL_TYPES.map((p) => {
                  const active = (filters.pool ?? []).includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePool(p.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.waterfrontRequired ?? false}
                  onChange={(e) => setFilters({ ...filters, waterfrontRequired: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Real waterfront only
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.privateWaterfrontAccess ?? false}
                  onChange={(e) => setFilters({ ...filters, privateWaterfrontAccess: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Private access to waterfront
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.noCouchBeds ?? false}
                  onChange={(e) => setFilters({ ...filters, noCouchBeds: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                No couch beds
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.noBunkBeds ?? false}
                  onChange={(e) => setFilters({ ...filters, noBunkBeds: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                No bunk beds
              </label>
              <label className="flex items-center gap-2 col-span-2">
                <input
                  type="checkbox"
                  checked={filters.renovatedOnly ?? false}
                  onChange={(e) => setFilters({ ...filters, renovatedOnly: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Renovated only
              </label>
            </div>
          </div>
        )}
      </section>

      <button
        type="submit"
        disabled={submitting || !location || !groupSize}
        className="w-full rounded-lg bg-zinc-900 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-zinc-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {submitting ? "Searching…" : "Find the best options"}
      </button>
    </form>
  );
}
