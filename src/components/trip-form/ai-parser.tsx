import { Pressable, Text, TextInput, View } from "react-native";
import type { TripFormState } from "@/components/trip-form/use-trip-form";

export function AiParser({ form }: { form: TripFormState }) {
  const {
    aiText, setAiText,
    aiLoading,
    aiError,
    aiAppliedKeys,
    handleParseWithAI,
  } = form;

  return (
    <>
      {/* AI freeform parser */}
      <View className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <View className="mb-2 flex-row items-center gap-2">
          <View className="rounded-full bg-zinc-900 px-1.5 py-0.5 dark:bg-white">
            <Text className="text-[10px] font-bold uppercase text-white dark:text-zinc-900">
              AI
            </Text>
          </View>
          <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Describe your trip — I&apos;ll fill the form
          </Text>
        </View>
        <TextInput
          value={aiText}
          onChangeText={setAiText}
          placeholder="e.g. 4 bedroom house, 5 beds, 10 min from town, real outdoor in-ground pool, no indoor or above ground, 8 people, $4-6k total, chill vibe"
          multiline
          numberOfLines={3}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <View className="mt-2 flex-row items-center justify-between gap-2">
          <View className="flex-1">
            {aiError && (
              <Text className="text-xs text-red-600 dark:text-red-400">
                {aiError}
              </Text>
            )}
            {aiAppliedKeys.length > 0 && !aiError && (
              <Text className="text-xs text-emerald-700 dark:text-emerald-400">
                ✓ Applied: {aiAppliedKeys.join(", ")}
              </Text>
            )}
          </View>
          <Pressable
            onPress={handleParseWithAI}
            disabled={aiLoading || !aiText.trim()}
            className={`rounded-lg px-4 py-2 ${
              aiLoading || !aiText.trim()
                ? "bg-zinc-300 dark:bg-zinc-700"
                : "bg-zinc-900 dark:bg-white"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                aiLoading || !aiText.trim()
                  ? "text-zinc-500"
                  : "text-white dark:text-zinc-900"
              }`}
            >
              {aiLoading ? "Parsing…" : "Parse with AI"}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
