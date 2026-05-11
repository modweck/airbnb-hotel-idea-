"use client";

import { useSyncExternalStore } from "react";
import { isSaved, subscribeSaved, toggleSaved, type SavedListing } from "@/lib/saved";

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

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(listing);
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        saved
          ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
      } ${className}`}
      title={saved ? "Remove from saved" : "Save listing"}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
