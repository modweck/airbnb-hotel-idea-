import { Pressable, Text, TextInput, View } from "react-native";
import {
  Checkbox,
  POOL_TYPES,
  parseDigits,
} from "@/components/trip-form/shared";
import type { TripFormState } from "@/components/trip-form/use-trip-form";

export function AdvancedFilters({ form }: { form: TripFormState }) {
  const {
    showAdvanced, setShowAdvanced,
    filters, setFilters,
    togglePool,
  } = form;

  return (
    <>
      {/* Advanced — hard filters */}
      <View className="space-y-3">
        <Pressable onPress={() => setShowAdvanced((v) => !v)}>
          <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {showAdvanced ? "− Hide" : "+ Advanced filters"}
          </Text>
        </Pressable>

        {showAdvanced && (
          <View className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <Checkbox
              checked={filters.allowCouchBeds ?? false}
              onChange={(v) => setFilters({ ...filters, allowCouchBeds: v })}
              label="Allow couch beds to count"
              hint="(off by default — bed truth)"
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Min full bathrooms
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  value={filters.minFullBaths === undefined ? "" : String(filters.minFullBaths)}
                  onChangeText={(t) => {
                    const v = parseDigits(t);
                    setFilters({
                      ...filters,
                      minFullBaths: v === "" ? undefined : v,
                    });
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Max minutes to town
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  value={filters.maxMinutesToTown === undefined ? "" : String(filters.maxMinutesToTown)}
                  onChangeText={(t) => {
                    const v = parseDigits(t);
                    setFilters({
                      ...filters,
                      maxMinutesToTown: v === "" ? undefined : v,
                    });
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Pool requirements
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {POOL_TYPES.map((p) => {
                  const active = (filters.pool ?? []).includes(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => togglePool(p.id)}
                      className={`rounded-full px-3 py-1.5 ${
                        active
                          ? "bg-zinc-900 dark:bg-white"
                          : "bg-zinc-100 dark:bg-zinc-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
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

            <View className="space-y-2">
              <Checkbox
                checked={filters.waterfrontRequired ?? false}
                onChange={(v) => setFilters({ ...filters, waterfrontRequired: v })}
                label="Real waterfront only"
              />
              <Checkbox
                checked={filters.privateWaterfrontAccess ?? false}
                onChange={(v) => setFilters({ ...filters, privateWaterfrontAccess: v })}
                label="Private access to waterfront"
              />
              <Checkbox
                checked={filters.noCouchBeds ?? false}
                onChange={(v) => setFilters({ ...filters, noCouchBeds: v })}
                label="No couch beds"
              />
              <Checkbox
                checked={filters.noBunkBeds ?? false}
                onChange={(v) => setFilters({ ...filters, noBunkBeds: v })}
                label="No bunk beds"
              />
              <Checkbox
                checked={filters.renovatedOnly ?? false}
                onChange={(v) => setFilters({ ...filters, renovatedOnly: v })}
                label="Renovated only"
              />
            </View>
          </View>
        )}
      </View>
    </>
  );
}
