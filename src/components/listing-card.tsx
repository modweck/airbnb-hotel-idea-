import type { Listing } from "@/lib/types";

type DisplayMode = "total" | "per_person";

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function ListingCard({
  listing,
  groupSize,
  budgetMode,
  overBudget = false,
}: {
  listing: Listing;
  groupSize: number;
  budgetMode: DisplayMode;
  overBudget?: boolean;
}) {
  const { totalForStay } = listing.pricing;
  const perPerson = groupSize > 0 ? totalForStay / groupSize : totalForStay;

  const primary =
    budgetMode === "per_person"
      ? { amount: perPerson, label: "per person" }
      : { amount: totalForStay, label: "total" };
  const secondary =
    budgetMode === "per_person"
      ? { amount: totalForStay, label: "total" }
      : { amount: perPerson, label: "per person" };

  const photo = listing.photos[0];
  const minutesLabel =
    listing.location.walkMinutesToTown !== undefined
      ? `${listing.location.walkMinutesToTown} min walk`
      : listing.location.driveMinutesToTown !== undefined
      ? `${listing.location.driveMinutesToTown} min drive`
      : null;

  return (
    <article className="group flex overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative w-40 shrink-0 bg-zinc-100 dark:bg-zinc-800 sm:w-56">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={listing.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            no photo
          </div>
        )}
        {overBudget && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
            Slightly over budget
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-zinc-900/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          {listing.type}
        </span>
        {listing.vibeTag && (
          <span
            className={`absolute left-2 ${overBudget ? "top-10" : "top-2"} rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white ${
              listing.vibeTag === "lively"
                ? "bg-emerald-600/90"
                : listing.vibeTag === "moderate"
                ? "bg-blue-500/90"
                : "bg-zinc-500/90"
            }`}
          >
            {listing.vibeTag}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2 p-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
            {listing.name}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {listing.location.town}
            {listing.location.region ? `, ${listing.location.region}` : ""}
            {minutesLabel ? ` · ${minutesLabel}` : ""}
            {listing.distanceMi != null && listing.distanceTo && (
              <> · {listing.distanceMi} mi to {listing.distanceTo.split(",")[0]}</>
            )}
          </p>
          {listing.type === "hotel" && listing.hotelRooms ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {listing.hotelRooms} room{listing.hotelRooms === 1 ? "" : "s"}
              {" · 2 queen beds each"}
              {" · "}
              {formatUSD(listing.pricing.nightlyBase / listing.hotelRooms)}/room/night
              {listing.hotelStars ? ` · ${listing.hotelStars}★` : ""}
            </p>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {listing.capacity.realBeds} real bed
              {listing.capacity.realBeds === 1 ? "" : "s"} ·{" "}
              {listing.bathrooms.full} bath
              {listing.bathrooms.full === 1 ? "" : "s"} · sleeps{" "}
              {listing.capacity.maxGuests}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div className="leading-tight">
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {formatUSD(primary.amount)}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">
              {primary.label} · {formatUSD(secondary.amount)} {secondary.label}
            </div>
          </div>
          <a
            href={listing.affiliateUrl ?? listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            View
          </a>
        </div>
      </div>
    </article>
  );
}
