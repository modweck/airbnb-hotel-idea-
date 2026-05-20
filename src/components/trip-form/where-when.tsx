import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { DateInput } from "@/components/date-input";
import { PlaceAutocomplete } from "@/components/place-autocomplete";
import {
  Checkbox,
  DURATIONS,
  nextTwelveMonths,
} from "@/components/trip-form/shared";
import type { TripFormState } from "@/components/trip-form/use-trip-form";

export function WhereWhen({ form }: { form: TripFormState }) {
  const {
    location, setLocation,
    distanceTo, setDistanceTo,
    checkIn, setCheckIn,
    checkOut, setCheckOut,
    flexibleDates, setFlexibleDates,
    flexibleDuration, setFlexibleDuration,
    mustIncludeWeekend, setMustIncludeWeekend,
    flexibleMonths, toggleMonth,
  } = form;

  return (
    <>
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <Text className="text-xs uppercase tracking-wider text-zinc-400">
          or fill in manually
        </Text>
        <View className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </View>

      {/* Where & when */}
      <View className="space-y-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Where & when
          </Text>
          <Link href={"/saved" as never} asChild>
            <Pressable className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-700 dark:bg-zinc-800">
              <Text className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Saved
              </Text>
            </Pressable>
          </Link>
        </View>
        <View style={{ zIndex: 20 }}>
          <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Location
          </Text>
          <PlaceAutocomplete
            placeholder="e.g. Lake Tahoe, Miami, Aspen"
            value={location}
            onChange={setLocation}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
        </View>

        <View style={{ zIndex: 10 }}>
          <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Distance to (optional)
          </Text>
          <PlaceAutocomplete
            placeholder="e.g. South Beach, Times Square, 123 Ocean Dr"
            value={distanceTo}
            onChange={setDistanceTo}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
          <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            We&apos;ll show how far each listing is from this place
          </Text>
        </View>

        {/* Toggle between exact dates and flexible-dates picker */}
        <View className="flex-row self-start rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <Pressable
            onPress={() => setFlexibleDates(false)}
            className={`rounded-md px-3 py-1.5 ${
              !flexibleDates
                ? "bg-white shadow-sm dark:bg-zinc-800"
                : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                !flexibleDates
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500"
              }`}
            >
              Exact dates
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFlexibleDates(true)}
            className={`rounded-md px-3 py-1.5 ${
              flexibleDates
                ? "bg-white shadow-sm dark:bg-zinc-800"
                : ""
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                flexibleDates
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500"
              }`}
            >
              I&apos;m flexible
            </Text>
          </Pressable>
        </View>

        {!flexibleDates ? (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Check-in
              </Text>
              <DateInput
                value={checkIn}
                onChange={setCheckIn}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Check-out
              </Text>
              <DateInput
                value={checkOut}
                onChange={setCheckOut}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
              />
            </View>
          </View>
        ) : (
          <View className="space-y-5 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            {/* Duration */}
            <View>
              <Text className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                How long do you want to stay?
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {DURATIONS.map((d) => {
                  const active = flexibleDuration === d.id;
                  return (
                    <Pressable
                      key={d.id}
                      onPress={() =>
                        setFlexibleDuration(active ? null : d.id)
                      }
                      className={`rounded-full border px-4 py-2 ${
                        active
                          ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                          : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          active
                            ? "text-white dark:text-zinc-900"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Checkbox
              checked={mustIncludeWeekend}
              onChange={setMustIncludeWeekend}
              label="Must include a weekend"
            />

            {/* Months */}
            <View>
              <Text className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                When do you want to travel?
              </Text>
              <Text className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                Pick one or more months.
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {nextTwelveMonths().map((m) => {
                  const active = flexibleMonths.includes(m.key);
                  return (
                    <Pressable
                      key={m.key}
                      onPress={() => toggleMonth(m.key)}
                      className={`w-[30%] items-center rounded-lg border px-3 py-3 sm:w-[22%] ${
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
                        {m.monthLabel}
                      </Text>
                      <Text
                        className={`text-xs ${
                          active
                            ? "text-white/70 dark:text-zinc-900/70"
                            : "text-zinc-500"
                        }`}
                      >
                        {m.year}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </View>


    </>
  );
}
