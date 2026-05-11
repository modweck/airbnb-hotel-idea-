"use client";

import { useState } from "react";
import type { Listing } from "@/lib/types";
import { ListingCard } from "@/components/listing-card";

type SortOption = "price" | "distance" | "rating" | "vibe";
type DisplayMode = "total" | "per_person";

const VIBE_ORDER = { lively: 0, moderate: 1, quiet: 2 } as const;

function sortListings(listings: Listing[], sort: SortOption): Listing[] {
  const sorted = [...listings];
  switch (sort) {
    case "price":
      return sorted.sort((a, b) => a.pricing.totalForStay - b.pricing.totalForStay);
    case "distance":
      return sorted.sort((a, b) => (a.distanceMi ?? 9999) - (b.distanceMi ?? 9999));
    case "rating":
      return sorted.sort((a, b) => (b.hotelStars ?? 0) - (a.hotelStars ?? 0));
    case "vibe":
      return sorted.sort((a, b) =>
        (VIBE_ORDER[a.vibeTag ?? "quiet"]) - (VIBE_ORDER[b.vibeTag ?? "quiet"])
      );
  }
}

export function SortableListings({
  matched,
  overflow,
  groupSize,
  budgetMode,
  hasDistance,
}: {
  matched: Listing[];
  overflow: Listing[];
  groupSize: number;
  budgetMode: DisplayMode;
  hasDistance: boolean;
}) {
  const [sort, setSort] = useState<SortOption>("price");

  const sortedMatched = sortListings(matched, sort);
  const sortedOverflow = sortListings(overflow, sort);

  const options: { id: SortOption; label: string }[] = [
    { id: "price", label: "Price" },
    ...(hasDistance ? [{ id: "distance" as const, label: "Distance" }] : []),
    { id: "rating", label: "Rating" },
    { id: "vibe", label: "Vibe" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Sort by
        </span>
        <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => setSort(o.id)}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                sort === o.id
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {sortedMatched.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            {sortedMatched.length === 1
              ? "1 match"
              : `${sortedMatched.length} matches`}
          </h2>
          <div className="space-y-3">
            {sortedMatched.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                groupSize={groupSize}
                budgetMode={budgetMode}
              />
            ))}
          </div>
        </section>
      )}

      {sortedOverflow.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Slightly over budget
          </h2>
          <div className="space-y-3">
            {sortedOverflow.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                groupSize={groupSize}
                budgetMode={budgetMode}
                overBudget
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
