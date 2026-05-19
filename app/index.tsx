import { ScrollView, Text, View } from "react-native";
import { TripForm } from "@/components/trip-form";

export default function Home() {
  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-950"
      contentContainerClassName="mx-auto w-full max-w-2xl px-6 py-12 sm:py-20"
    >
      <View className="mb-10 space-y-3">
        <Text className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Find the best place for your group.
        </Text>
        <Text className="text-lg text-zinc-600 dark:text-zinc-400">
          Stop scrolling. We rank 3–5 actually good options across VRBO,
          Booking, and more — by real value, not just price.
        </Text>
      </View>
      <TripForm />
    </ScrollView>
  );
}
