import { Image, Linking, Pressable, Text, View } from "react-native";
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

  const distancePart =
    listing.distanceMi != null && listing.distanceTo
      ? ` · ${listing.distanceMi} mi to ${listing.distanceTo.split(",")[0]}`
      : "";

  const subtitleLine =
    `${listing.location.town}` +
    (listing.location.region ? `, ${listing.location.region}` : "") +
    (minutesLabel ? ` · ${minutesLabel}` : "") +
    distancePart;

  function openListing() {
    Linking.openURL(listing.affiliateUrl ?? listing.url);
  }

  return (
    <View className="flex-row overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <View className="relative w-40 shrink-0 bg-zinc-100 dark:bg-zinc-800 sm:w-56">
        {photo ? (
          <Image
            source={{ uri: photo }}
            alt={listing.name}
            accessibilityLabel={listing.name}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full items-center justify-center">
            <Text className="text-xs text-zinc-400">no photo</Text>
          </View>
        )}
        {overBudget && (
          <View className="absolute left-2 top-2 rounded-full bg-amber-500/95 px-2 py-0.5 shadow">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-white">
              Slightly over budget
            </Text>
          </View>
        )}
        <View className="absolute right-2 top-2 rounded-full bg-zinc-900/90 px-2 py-0.5">
          <Text className="text-[10px] font-bold uppercase text-white">
            {listing.type}
          </Text>
        </View>
        {listing.vibeTag && (
          <View
            className={`absolute left-2 ${overBudget ? "top-10" : "top-2"} rounded-full px-2 py-0.5 ${
              listing.vibeTag === "lively"
                ? "bg-emerald-600/90"
                : listing.vibeTag === "moderate"
                  ? "bg-blue-500/90"
                  : "bg-zinc-500/90"
            }`}
          >
            <Text className="text-[10px] font-bold uppercase text-white">
              {listing.vibeTag}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-1 justify-between gap-2 p-4">
        <View className="space-y-1">
          <Text
            numberOfLines={2}
            className="text-base font-semibold leading-tight text-zinc-900 dark:text-zinc-100"
          >
            {listing.name}
          </Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            {subtitleLine}
          </Text>
          {listing.type === "hotel" && listing.hotelRooms ? (
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              {listing.hotelRooms} room{listing.hotelRooms === 1 ? "" : "s"}
              {" · 2 queen beds each · "}
              {formatUSD(listing.pricing.nightlyBase / listing.hotelRooms)}
              /room/night
              {listing.hotelStars ? ` · ${listing.hotelStars}★` : ""}
            </Text>
          ) : (
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              {listing.capacity.realBeds} real bed
              {listing.capacity.realBeds === 1 ? "" : "s"} ·{" "}
              {listing.bathrooms.full} bath
              {listing.bathrooms.full === 1 ? "" : "s"} · sleeps{" "}
              {listing.capacity.maxGuests}
            </Text>
          )}
        </View>

        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-100">
              {formatUSD(primary.amount)}
            </Text>
            <Text className="text-[11px] uppercase tracking-wider text-zinc-500">
              {primary.label} · {formatUSD(secondary.amount)} {secondary.label}
            </Text>
          </View>
          <Pressable
            onPress={openListing}
            accessibilityRole="link"
            accessibilityLabel={`View ${listing.name}`}
            className="rounded-md bg-zinc-900 px-3 py-1.5 dark:bg-white"
          >
            <Text className="text-xs font-medium text-white dark:text-zinc-900">
              View
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
