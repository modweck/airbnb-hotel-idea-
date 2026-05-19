import { Pressable, Text, View } from "react-native";
import { VIBES } from "@/components/trip-form/shared";
import type { TripFormState } from "@/components/trip-form/use-trip-form";

export function PriorityVibe({ form }: { form: TripFormState }) {
  const {
    priority, setPriority,
    vibes, setVibes,
  } = form;

  return (
    <>
      {/* What matters most? */}
      <View className="space-y-3">
        <Text className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          What matters most?
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(
            [
              { id: "value", label: "💰 Best value" },
              { id: "location", label: "📍 Best location" },
              { id: "vibe", label: "🎉 Best vibe" },
              { id: "overall", label: "🏆 Best overall" },
            ] as const
          ).map((p) => {
            const active = priority === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPriority(p.id)}
                className={`flex-1 rounded-lg border px-3 py-3 ${
                  active
                    ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                    : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              >
                <Text
                  className={`text-center text-sm font-medium ${
                    active
                      ? "text-white dark:text-zinc-900"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Vibe */}
      <View className="space-y-3">
        <Text className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Area vibe
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => setVibes([])}
            className={`rounded-full px-4 py-2 ${
              vibes.length === 0
                ? "bg-zinc-900 dark:bg-white"
                : "bg-zinc-100 dark:bg-zinc-800"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                vibes.length === 0
                  ? "text-white dark:text-zinc-900"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              Any
            </Text>
          </Pressable>
          {VIBES.map((v) => {
            const active = vibes.includes(v.id);
            return (
              <Pressable
                key={v.id}
                onPress={() => setVibes([v.id])}
                className={`rounded-full px-4 py-2 ${
                  active
                    ? "bg-zinc-900 dark:bg-white"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    active
                      ? "text-white dark:text-zinc-900"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {v.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

    </>
  );
}
