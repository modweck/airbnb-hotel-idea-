import { Pressable, Text, TextInput, View } from "react-native";
import { parseDigits } from "@/components/trip-form/shared";
import type { TripFormState } from "@/components/trip-form/use-trip-form";

export function WhoBudget({ form }: { form: TripFormState }) {
  const {
    groupSize, setGroupSize,
    pairs, setPairs,
    minBeds, setMinBeds,
    suggestedMinBeds,
    budgetMode, setBudgetMode,
    budgetMin, setBudgetMin,
    budgetMax, setBudgetMax,
    budgetPreview,
    stayType, setStayType,
  } = form;

  return (
    <>
      {/* Who & how much */}
      <View className="space-y-4">
        <Text className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Who & how much
        </Text>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Group size
            </Text>
            <TextInput
              keyboardType="number-pad"
              value={String(groupSize)}
              onChangeText={(t) => setGroupSize(parseDigits(t))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Sharing
            </Text>
            <TextInput
              keyboardType="number-pad"
              value={String(pairs)}
              onChangeText={(t) => setPairs(parseDigits(t))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Min beds
            </Text>
            <TextInput
              keyboardType="number-pad"
              placeholder={suggestedMinBeds ? `Auto: ${suggestedMinBeds}` : "Auto"}
              value={String(minBeds)}
              onChangeText={(t) => setMinBeds(parseDigits(t))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
            />
          </View>
        </View>
        <Text className="text-xs text-zinc-500 dark:text-zinc-400">
          Pairs sharing = how many will share a bed (queen / king / double).
          Everyone else gets their own bed (any size). No couches.
        </Text>

        <View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Budget range
            </Text>
            <View className="flex-row rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              <Pressable
                onPress={() => setBudgetMode("total")}
                className={`rounded-md px-2.5 py-1 ${
                  budgetMode === "total"
                    ? "bg-white shadow-sm dark:bg-zinc-800"
                    : ""
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    budgetMode === "total"
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-500"
                  }`}
                >
                  Total
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setBudgetMode("per_person")}
                className={`rounded-md px-2.5 py-1 ${
                  budgetMode === "per_person"
                    ? "bg-white shadow-sm dark:bg-zinc-800"
                    : ""
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    budgetMode === "per_person"
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-500"
                  }`}
                >
                  Per person
                </Text>
              </Pressable>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-900">
            <Text className="text-sm text-zinc-400">$</Text>
            <TextInput
              keyboardType="number-pad"
              placeholder="Min"
              accessibilityLabel="Minimum budget"
              value={String(budgetMin)}
              onChangeText={(t) => setBudgetMin(parseDigits(t))}
              className="flex-1 bg-transparent py-3 text-base"
            />
            <Text className="text-zinc-400">–</Text>
            <TextInput
              keyboardType="number-pad"
              placeholder="Max"
              accessibilityLabel="Maximum budget"
              value={String(budgetMax)}
              onChangeText={(t) => setBudgetMax(parseDigits(t))}
              className="flex-1 bg-transparent py-3 text-base"
            />
          </View>
          {budgetPreview && (
            <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              = {budgetPreview}
            </Text>
          )}
        </View>

        {/* Stay type */}
        <View>
          <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Stay type
          </Text>
          <View className="flex-row gap-2">
            {(
              [
                { id: "both", label: "🔀 Both", sub: "Houses + Hotels" },
                { id: "houses", label: "🏠 Houses", sub: "VRBO" },
                { id: "hotels", label: "🏨 Hotels", sub: "Booking" },
              ] as const
            ).map((s) => {
              const active = stayType === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setStayType(s.id)}
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
                    {s.label}
                  </Text>
                  <Text
                    className={`text-xs ${
                      active
                        ? "text-white/70 dark:text-zinc-900/70"
                        : "text-zinc-500"
                    }`}
                  >
                    {s.sub}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </>
  );
}
