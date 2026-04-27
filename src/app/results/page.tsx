import Link from "next/link";

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
  pairs?: string;
  stayType?: string;
  priority?: string;
  vibes?: string;
  filters?: string;
};

export default async function ResultsPage(props: PageProps<"/results">) {
  const sp = (await props.searchParams) as SearchParams;
  const location = sp.location ?? "";
  const groupSize = sp.groupSize ?? "";
  const checkIn = sp.checkIn ?? "";
  const checkOut = sp.checkOut ?? "";
  const flexible = sp.flexible === "1";
  const flexDuration = sp.flexDuration;
  const flexWeekend = sp.flexWeekend === "1";
  const flexMonths = sp.flexMonths?.split(",").filter(Boolean) ?? [];
  const budgetMin = sp.budgetMin;
  const budgetMax = sp.budgetMax;
  const budgetMode = sp.budgetMode === "per_person" ? "pp" : "total";
  const minBeds = sp.minBeds;
  const pairs = sp.pairs;
  const stayType = sp.stayType ?? "both";
  const priority = sp.priority ?? "value";
  const vibes = sp.vibes?.split(",").filter(Boolean) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <Link
        href="/"
        className="mb-6 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← New search
      </Link>

      <header className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {location || "Your trip"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {groupSize && `${groupSize} people`}
          {flexible
            ? ` · flexible${flexDuration ? ` (${flexDuration})` : ""}${
                flexMonths.length ? ` in ${flexMonths.join(", ")}` : ""
              }${flexWeekend ? " · weekend" : ""}`
            : checkIn && checkOut
            ? ` · ${checkIn} → ${checkOut}`
            : ""}
          {pairs && ` · ${pairs} pair${pairs === "1" ? "" : "s"} sharing`}
          {minBeds && ` · ${minBeds}+ beds`}
          {(budgetMin || budgetMax) &&
            ` · $${budgetMin ?? "0"}–${budgetMax ?? "∞"} ${budgetMode}`}
          {stayType !== "both" && ` · ${stayType} only`}
          {` · sorted by ${priority}`}
          {vibes.length > 0 && ` · ${vibes.join(", ")}`}
        </p>
      </header>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          🛠 Listings pipeline not connected yet.
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Once VRBO + Booking Apify scrapers return JSON, we wire them in here, rank by Value Score,
          and show the top 5 with reasons. Form, schema, and ranking shape are in place.
        </p>
      </div>
    </main>
  );
}
