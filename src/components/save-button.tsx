import { useSyncExternalStore } from "react";
import { Pressable, Text } from "react-native";
import {
  isSaved,
  subscribeSaved,
  toggleSaved,
  type SavedListing,
} from "@/lib/saved";

interface SaveButtonProps {
  listing: SavedListing;
  className?: string;
}

export function SaveButton({ listing, className = "" }: SaveButtonProps) {
  const saved = useSyncExternalStore(
    subscribeSaved,
    () => isSaved(listing.id),
    () => false,
  );

  function handlePress() {
    toggleSaved(listing);
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={saved ? "Remove from saved" : "Save listing"}
      className={`flex-row items-center gap-1.5 rounded-lg border px-3 py-1.5 ${
        saved
          ? "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20"
          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
      } ${className}`}
    >
      <Text
        className={`text-xs ${
          saved
            ? "text-rose-600 dark:text-rose-400"
            : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {saved ? "♥" : "♡"}
      </Text>
      <Text
        className={`text-xs font-medium ${
          saved
            ? "text-rose-600 dark:text-rose-400"
            : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {saved ? "Saved" : "Save"}
      </Text>
    </Pressable>
  );
}
