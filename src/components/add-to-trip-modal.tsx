// Add-to-Trip modal — UI only.
//
// While #44 (Supabase tables), #45 (trip-store), and #46 (/api/trips
// routes) are pending, we stub the "create" and "add" actions and
// rely on the `onAdded` callback so the parent can show a toast /
// navigate. When the API lands, swap the two stub helpers below for
// real trip-store calls; the props/behavior contract stays the same.

import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { Listing } from "@/lib/types";
import type { Trip } from "@/lib/trip-types";

interface AddToTripModalProps {
  visible: boolean;
  listing: Listing | null;
  existingTrips: Trip[];
  onClose: () => void;
  /** Called after a successful add. Use this to show a toast / navigate. */
  onAdded: (trip: Trip, mode: "created" | "appended") => void;
}

export function AddToTripModal({
  visible,
  listing,
  existingTrips,
  onClose,
  onAdded,
}: AddToTripModalProps) {
  function handleCreateNewTrip() {
    if (!listing) return;
    // Stub: real flow calls trip-store.createTrip({ destination, listing })
    // when #45 lands.
    const slug = `new-trip-${Date.now()}`;
    const stubbed: Trip = {
      id: slug,
      slug,
      title: "New trip",
      destination: listing.location.town || "",
      checkIn: "",
      checkOut: "",
      groupSize: 0,
      ownerMemberId: "anon",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onAdded(stubbed, "created");
    onClose();
  }

  function handleAppendToTrip(trip: Trip) {
    if (!listing) return;
    // Stub: real flow calls trip-store.addListingToTrip(trip.id, listing) when #45 lands.
    onAdded(trip, "appended");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType="fade"
    >
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close add-to-trip dialog"
        className="flex-1 items-center justify-center bg-black/40 px-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-zinc-900"
        >
          <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Add to a trip
          </Text>
          {listing && (
            <Text
              numberOfLines={1}
              className="mt-1 text-sm text-zinc-500 dark:text-zinc-400"
            >
              {listing.name}
            </Text>
          )}

          <Pressable
            onPress={handleCreateNewTrip}
            accessibilityRole="button"
            className="mt-5 rounded-xl bg-zinc-900 px-4 py-3 dark:bg-white"
          >
            <Text className="text-center text-sm font-medium text-white dark:text-zinc-900">
              + Create new trip
            </Text>
          </Pressable>

          {existingTrips.length > 0 && (
            <View className="mt-5">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Add to existing trip
              </Text>
              <ScrollView className="max-h-64">
                {existingTrips.map((trip) => (
                  <Pressable
                    key={trip.id}
                    onPress={() => handleAppendToTrip(trip)}
                    accessibilityRole="button"
                    className="mb-2 rounded-lg border border-zinc-200 px-3 py-3 dark:border-zinc-700"
                  >
                    <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {trip.title}
                    </Text>
                    <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                      {trip.destination}
                      {trip.checkIn && trip.checkOut
                        ? ` · ${trip.checkIn} → ${trip.checkOut}`
                        : ""}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            className="mt-3 rounded-lg px-3 py-2"
          >
            <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
