import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { Listing } from "@/lib/types";
import { ListingCard } from "@/components/listing-card";
import { sortListings, type SortOption } from "@/lib/listing-sort";

type DisplayMode = "total" | "per_person";

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
    <View className="space-y-4">
      <View className="flex-row items-center gap-2">
        <Text className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Sort by
        </Text>
        <View className="flex-row rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          {options.map((o) => {
            const active = sort === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => setSort(o.id)}
                className={`rounded-md px-3 py-1.5 ${
                  active ? "bg-white shadow-sm dark:bg-zinc-800" : ""
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    active
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {sortedMatched.length > 0 && (
        <View className="space-y-3">
          <Text className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            {sortedMatched.length === 1
              ? "1 match"
              : `${sortedMatched.length} matches`}
          </Text>
          <View className="space-y-3">
            {sortedMatched.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                groupSize={groupSize}
                budgetMode={budgetMode}
              />
            ))}
          </View>
        </View>
      )}

      {sortedOverflow.length > 0 && (
        <View className="space-y-3">
          <Text className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Slightly over budget
          </Text>
          <View className="space-y-3">
            {sortedOverflow.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                groupSize={groupSize}
                budgetMode={budgetMode}
                overBudget
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
