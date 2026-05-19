import Link from "next/link";
import { SortableListings } from "@/components/sortable-listings";
import { searchTrip, type SearchTripInput } from "@/server/search/pipeline";

type SearchParams = {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  flexible?: string;
  flexDuration?: string;
  flexWeekend?: string;
  flexMonths?: string;
  groupSize?: string;
  budgetMin?: string;
  budgetMax?: string;
  budgetMode?: string;
  minBeds?: string;
  minBathrooms?: string;
  pairs?: string;
  stayType?: string;
  priority?: string;
  vibes?: string;
  filters?: string;
  distanceTo?: string;
};

function parseNumber(s: string | undefined): number | undefined {
  if (s === undefined || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ResultsPage(props: PageProps<"/results">) {
  const sp = (await props.searchParams) as SearchParams;
  const location = sp.location ?? "";
  const groupSize = parseNumber(sp.groupSize) ?? 0;
  const checkIn = sp.checkIn ?? "";
  const checkOut = sp.checkOut ?? "";
  const flexible = sp.flexible === "1";
  const flexDuration = sp.flexDuration;
  const flexWeekend = sp.flexWeekend === "1";
  const flexMonths = sp.flexMonths?.split(",").filter(Boolean) ?? [];
  const budgetMin = parseNumber(sp.budgetMin);
  const budgetMax = parseNumber(sp.budgetMax);
  const budgetMode: "total" | "per_person" =
    sp.budgetMode === "per_person" ? "per_person" : "total";
  const budgetModeLabel =
    budgetMode === "per_person" ? "per person" : "total";
  const minBeds = parseNumber(sp.minBeds);
  const minBathrooms = parseNumber(sp.minBathrooms);
  const pairs = parseNumber(sp.pairs) ?? 0;
  const stayType = (sp.stayType ?? "both") as "houses" | "hotels" | "both";
  const priority = sp.priority ?? "value";
  const vibes = sp.vibes?.split(",").filter(Boolean) ?? [];
  const distanceTo = sp.distanceTo ?? "";

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

  let matched: Awaited<ReturnType<typeof searchTrip>>["matched"] = [];
  let overflow: Awaited<ReturnType<typeof searchTrip>>["overflow"] = [];
  let meta: Awaited<ReturnType<typeof searchTrip>>["meta"] | null = null;
  let error: string | null = null;

  try {
    const result = await searchTrip(input);
    matched = result.matched;
    overflow = result.overflow;
    meta = result.meta;
  } catch (err) {
    error = err instanceof Error ? err.message : "Search failed";
  }

  const needsLiveQuery = meta?.needsLiveQuery ?? true;
  const hasRequiredParams = meta?.hasRequiredParams ?? false;
  const providerName = meta?.providerName ?? "unknown";
  const totalShown = matched.length + overflow.length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <Link
        href="/"
        className="mb-6 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        &larr; New search
      </Link>

      <header className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {location || "Your trip"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {groupSize > 0 && `${groupSize} people`}
          {flexible
            ? ` · flexible${flexDuration ? ` (${flexDuration})` : ""}${
                flexMonths.length ? ` in ${flexMonths.join(", ")}` : ""
              }${flexWeekend ? " · weekend" : ""}`
            : checkIn && checkOut
            ? ` · ${checkIn} → ${checkOut}`
            : ""}
          {pairs > 0 && ` · ${pairs} pair${pairs === 1 ? "" : "s"} sharing`}
          {minBeds && ` · ${minBeds}+ beds`}
          {(budgetMin !== undefined || budgetMax !== undefined) &&
            ` · $${budgetMin ?? "0"}–${budgetMax ?? "∞"} ${budgetModeLabel}`}
          {stayType !== "both" && ` · ${stayType} only`}
          {` · sorted by ${priority}`}
          {vibes.length > 0 && ` · ${vibes.join(", ")}`}
        </p>
        <p className="text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
          source: {providerName}
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {!error && needsLiveQuery && !hasRequiredParams && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Missing search details.
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Location, check-in, and check-out dates are required.
          </p>
        </div>
      )}

      {!error && hasRequiredParams && (
        totalShown === 0 ? (
          <EmptyState budgetMax={budgetMax} budgetModeLabel={budgetModeLabel} />
        ) : (
          <SortableListings
            matched={matched}
            overflow={overflow}
            groupSize={groupSize}
            budgetMode={budgetMode}
            hasDistance={!!distanceTo}
          />
        )
      )}
    </main>
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
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        No listings within reach of your budget.
      </p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {budgetMax !== undefined ? (
          <>
            Even relaxing the ${budgetMax} {budgetModeLabel} ceiling by 15%
            didn&apos;t surface anything.
          </>
        ) : (
          <>Try widening your search and trying again.</>
        )}
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Adjust search
      </Link>
    </div>
  );
}
