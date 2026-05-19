import { Pressable, Text } from "react-native";
import type { TripFormState } from "@/components/trip-form/use-trip-form";

export function SubmitButton({ form }: { form: TripFormState }) {
  const { submitting, submitDisabled, handleSubmit } = form;

  return (
    <>
      <Pressable
        onPress={handleSubmit}
        disabled={submitDisabled}
        className={`w-full rounded-lg px-6 py-4 ${
          submitDisabled
            ? "bg-zinc-300 dark:bg-zinc-700"
            : "bg-zinc-900 dark:bg-white"
        }`}
      >
        <Text
          className={`text-center text-base font-semibold ${
            submitDisabled
              ? "text-zinc-500"
              : "text-white dark:text-zinc-900"
          }`}
        >
          {submitting ? "Searching…" : "Find the best options"}
        </Text>
      </Pressable>
    </>
  );
}
