import { useSyncExternalStore } from "react";
import { Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import {
  getSavedListings,
  getSavedListingsServerSnapshot,
  subscribeSaved,
  unsaveListing,
  type SavedListing,
} from "@/lib/saved";

export default function SavedPage() {
  const listings = useSyncExternalStore(
    subscribeSaved,
    getSavedListings,
    getSavedListingsServerSnapshot,
  );

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-950"
      contentContainerClassName="mx-auto w-full max-w-3xl px-6 py-10"
    >
      <Link href={"/" as never} asChild>
        <Pressable className="mb-6">
          <Text className="text-sm text-zinc-600 dark:text-zinc-400">
            ← Back
          </Text>
        </Pressable>
      </Link>

      <View className="mb-8">
        <Text className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Saved Listings
        </Text>
        <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {listings.length === 0
            ? "No saved listings yet"
            : `${listings.length} saved listing${listings.length !== 1 ? "s" : ""}`}
        </Text>
      </View>

      {listings.length === 0 ? (
        <View className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 dark:border-zinc-700 dark:bg-zinc-900">
          <Text className="mb-3 text-center text-3xl">🔖</Text>
          <Text className="text-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Nothing saved yet
          </Text>
          <Text className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Search for stays and tap Save on listings you like.
          </Text>
          <Link href={"/" as never} asChild>
            <Pressable className="mt-4 self-center rounded-lg bg-zinc-900 px-4 py-2 dark:bg-zinc-100">
              <Text className="text-sm font-medium text-white dark:text-zinc-900">
                Start searching
              </Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <View className="space-y-3">
          {listings.map((l) => (
            <SavedRow key={l.id} listing={l} />
          ))}
          <Text className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
            Saved listings are stored on this device. Sign in later to sync
            across devices.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function SavedRow({ listing: l }: { listing: SavedListing }) {
  return (
    <View className="flex-row gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      {l.photo ? (
        <Image
          source={{ uri: l.photo }}
          alt={l.name}
          accessibilityLabel={l.name}
          className="h-28 w-40 shrink-0 rounded-lg"
          resizeMode="cover"
        />
      ) : null}
      <View className="flex-1 justify-between">
        <View>
          <View className="flex-row items-center gap-2">
            <View className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {l.type === "house" ? "Home" : "Hotel"}
              </Text>
            </View>
            <Text className="text-xs text-zinc-500">{l.source}</Text>
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(l.url)}
          >
            <Text className="mt-1 font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
              {l.name}
            </Text>
          </Pressable>
          <Text className="mt-0.5 text-xs text-zinc-500">
            {l.location}
            {l.bedrooms > 0
              ? ` · ${l.bedrooms} bed${l.bedrooms !== 1 ? "s" : ""}`
              : ""}
            {l.bathrooms > 0
              ? ` · ${l.bathrooms} bath${l.bathrooms !== 1 ? "s" : ""}`
              : ""}
            {l.maxGuests > 0 ? ` · sleeps ${l.maxGuests}` : ""}
          </Text>
        </View>
        <View className="mt-2 flex-row items-end justify-between">
          <View className="flex-row items-baseline">
            <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              ${l.nightlyPrice}
            </Text>
            <Text className="text-sm text-zinc-500"> /night</Text>
            {l.totalPrice > 0 ? (
              <Text className="ml-2 text-xs text-zinc-500">
                ${l.totalPrice.toLocaleString()} total · ${l.perPersonPrice}
                /person
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => unsaveListing(l.id)}
            className="flex-row items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 dark:border-rose-800 dark:bg-rose-900/20"
          >
            <Text className="text-rose-600 dark:text-rose-400">♥</Text>
            <Text className="text-xs font-medium text-rose-600 dark:text-rose-400">
              Remove
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
