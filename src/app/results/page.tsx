import Link from "next/link";
import { searchListings, type SearchResults } from "@/lib/serpapi";
import type { Listing } from "@/lib/types";

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
};

function ListingCard({ listing }: { listing: Listing }) {
  const photo = listing.photos[0];
  return (
    <a
      href={listing.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
    >
      {photo && (
        <img
          src={photo}
          alt={listing.name}
          className="h-28 w-40 shrink-0 rounded-lg object-cover"
        />
      )}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {listing.type === "house" ? "Home" : "Hotel"}
            </span>
            {listing.hotelStars && (
              <span className="text-xs text-yellow-500">
                {"★".repeat(listing.hotelStars)}
              </span>
            )}
            <span className="text-xs text-zinc-500">{listing.source}</span>
          </div>
          <h3 className="mt-1 font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
            {listing.name}
          </h3>
          {listing.capacity.bedrooms > 0 && (
            <p className="mt-0.5 text-xs text-zinc-500">
              {listing.capacity.bedrooms} bed{listing.capacity.bedrooms !== 1 && "s"}
              {listing.bathrooms.full > 0 &&
                ` · ${listing.bathrooms.full} bath${listing.bathrooms.full !== 1 && "s"}`}
              {listing.capacity.maxGuests > 0 && ` · sleeps ${listing.capacity.maxGuests}`}
            </p>
          )}
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              ${listing.pricing.nightlyBase}
            </span>
            <span className="text-sm text-zinc-500"> /night</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              ${listing.pricing.totalForStay.toLocaleString()}
              <span className="font-normal text-zinc-500"> total</span>
            </div>
            <div className="text-xs text-zinc-500">
              ${listing.pricing.totalPerPerson}/person
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

export default async function ResultsPage(props: PageProps<"/results">) {
  const sp = (await props.searchParams) as SearchParams;
  const location = sp.location ?? "";
  const groupSize = parseInt(sp.groupSize ?? "2", 10);
  const checkIn = sp.checkIn ?? "";
  const checkOut = sp.checkOut ?? "";
  const flexible = sp.flexible === "1";
  const flexDuration = sp.flexDuration;
  const flexWeekend = sp.flexWeekend === "1";
  const flexMonths = sp.flexMonths?.split(",").filter(Boolean) ?? [];
  const budgetMin = sp.budgetMin ? parseInt(sp.budgetMin, 10) : undefined;
  const budgetMax = sp.budgetMax ? parseInt(sp.budgetMax, 10) : undefined;
  const budgetMode = sp.budgetMode ?? "total";
  const minBeds = sp.minBeds ? parseInt(sp.minBeds, 10) : undefined;
  const minBathrooms = sp.minBathrooms ? parseInt(sp.minBathrooms, 10) : undefined;
  const pairs = parseInt(sp.pairs ?? "0", 10);
  const stayType = (sp.stayType ?? "both") as "houses" | "hotels" | "both";
  const priority = sp.priority ?? "value";
  const vibes = sp.vibes?.split(",").filter(Boolean) ?? [];

  // Fetch listings directly on the server
  let results: SearchResults = { houses: [], hotels: [] };
  let error: string | null = null;

  if (location && checkIn && checkOut) {
    try {
      const solos = groupSize - pairs * 2;
      const hotelRooms = pairs + Math.ceil(solos / 2);

      const priceMin =
        budgetMode === "per_person" && budgetMin ? budgetMin * groupSize : budgetMin;
      const priceMax =
        budgetMode === "per_person" && budgetMax ? budgetMax * groupSize : budgetMax;

      results = await searchListings({
        location,
        checkIn,
        checkOut,
        groupSize,
        rooms: hotelRooms,
        minPrice: priceMin,
        maxPrice: priceMax,
        minBedrooms: minBeds,
        minBathrooms,
        stayType,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : "Search failed";
    }
  }

  const allListings = [...results.houses, ...results.hotels];

  // Sort by per-person price (best value first) as a simple initial ranking
  if (priority === "value") {
    allListings.sort((a, b) => a.pricing.totalPerPerson - b.pricing.totalPerPerson);
  }

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
          {groupSize && `${groupSize} people`}
          {flexible
            ? ` · flexible${flexDuration ? ` (${flexDuration})` : ""}${
                flexMonths.length ? ` in ${flexMonths.join(", ")}` : ""
              }${flexWeekend ? " · weekend" : ""}`
            : checkIn && checkOut
            ? ` · ${checkIn} → ${checkOut}`
            : ""}
          {pairs > 0 && ` · ${pairs} pair${pairs === 1 ? "" : "s"} sharing`}
          {minBeds && ` · ${minBeds}+ beds`}
          {(budgetMin || budgetMax) &&
            ` · $${budgetMin ?? "0"}–${budgetMax ?? "∞"} ${budgetMode === "per_person" ? "pp" : "total"}`}
          {stayType !== "both" && ` · ${stayType} only`}
          {` · sorted by ${priority}`}
          {vibes.length > 0 && ` · ${vibes.join(", ")}`}
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {!error && allListings.length === 0 && location && checkIn && checkOut && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            No listings found for this search.
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Try broadening your dates, location, or budget.
          </p>
        </div>
      )}

      {!error && (!location || !checkIn || !checkOut) && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Missing search details.
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Location, check-in, and check-out dates are required.
          </p>
        </div>
      )}

      {allListings.length > 0 && (
        <>
          {results.houses.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Homes ({results.houses.length})
              </h2>
              <div className="space-y-3">
                {results.houses
                  .sort((a, b) => a.pricing.totalPerPerson - b.pricing.totalPerPerson)
                  .map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
              </div>
            </section>
          )}

          {results.hotels.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Hotels ({results.hotels.length})
              </h2>
              <div className="space-y-3">
                {results.hotels
                  .sort((a, b) => a.pricing.totalPerPerson - b.pricing.totalPerPerson)
                  .map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
              </div>
            </section>
          )}

          <div className="mt-4 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Per-person breakdown ({groupSize} people)
            </h3>
            {allListings.length > 0 && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Cheapest option: ${Math.min(...allListings.map((l) => l.pricing.totalPerPerson))}/person
                {" · "}Most expensive: ${Math.max(...allListings.map((l) => l.pricing.totalPerPerson))}/person
              </p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
