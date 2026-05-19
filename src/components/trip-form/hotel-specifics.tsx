import { Pressable, Text, View } from "react-native";
import type { TripFormState } from "@/components/trip-form/use-trip-form";

export function HotelSpecifics({ form }: { form: TripFormState }) {
  const {
    stayType,
    minStars, setMinStars,
    peoplePerRoom, setPeoplePerRoom,
  } = form;

  return (
    <>
      {/* Hotel-specific: Star rating + Room occupancy */}
      {(stayType === "hotels" || stayType === "both") && (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Min star rating
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {(
                [
                  { val: "" as const, label: "Any" },
                  { val: 2 as const, label: "2+" },
                  { val: 3 as const, label: "3+" },
                  { val: 4 as const, label: "4+" },
                  { val: 5 as const, label: "5" },
                ]
              ).map((opt) => {
                const active = minStars === opt.val;
                return (
                  <Pressable
                    key={String(opt.val)}
                    onPress={() => setMinStars(opt.val)}
                    className={`rounded-md border px-3 py-2 ${
                      active
                        ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                        : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        active
                          ? "text-white dark:text-zinc-900"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              People per room
            </Text>
            <View className="flex-row gap-2">
              {(
                [
                  { val: 2 as const, label: "2", sub: "Own bed" },
                  { val: 4 as const, label: "4", sub: "Share beds" },
                ]
              ).map((opt) => {
                const active = peoplePerRoom === opt.val;
                return (
                  <Pressable
                    key={opt.val}
                    onPress={() => setPeoplePerRoom(opt.val)}
                    className={`flex-1 rounded-lg border px-3 py-2 ${
                      active
                        ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                        : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        active
                          ? "text-white dark:text-zinc-900"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {opt.label}/room
                    </Text>
                    <Text
                      className={`text-xs ${
                        active
                          ? "text-white/70 dark:text-zinc-900/70"
                          : "text-zinc-500"
                      }`}
                    >
                      {opt.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </>
  );
}
