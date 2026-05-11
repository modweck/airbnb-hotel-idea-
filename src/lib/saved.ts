"use client";

// localStorage-based save system for listings
// Saves persist on this browser/device only. No account needed.

const STORAGE_KEY = "saved_listings";

export interface SavedListing {
  id: string;
  name: string;
  source: string;
  type: string;
  url: string;
  photo?: string;
  location: string;
  nightlyPrice: number;
  totalPrice: number;
  perPersonPrice: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  savedAt: string;
}

function getAll(): SavedListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Cached snapshot so useSyncExternalStore consumers get a stable reference
// between events (returning a fresh array each call would loop forever).
let snapshotCache: SavedListing[] | null = null;
const EMPTY: SavedListing[] = [];

function setAll(listings: SavedListing[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  } catch {
    /* storage full */
  }
  invalidate();
}

function invalidate() {
  snapshotCache = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("saved-changed"));
  }
}

export function getSavedListings(): SavedListing[] {
  if (typeof window === "undefined") return EMPTY;
  if (snapshotCache === null) snapshotCache = getAll();
  return snapshotCache;
}

export function getSavedListingsServerSnapshot(): SavedListing[] {
  return EMPTY;
}

export function subscribeSaved(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("saved-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("saved-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

export function isSaved(id: string): boolean {
  return getSavedListings().some((l) => l.id === id);
}

export function saveListing(listing: SavedListing) {
  const all = getAll();
  if (all.some((l) => l.id === listing.id)) return;
  all.unshift({ ...listing, savedAt: new Date().toISOString() });
  setAll(all);
}

export function unsaveListing(id: string) {
  setAll(getAll().filter((l) => l.id !== id));
}

export function toggleSaved(listing: SavedListing): boolean {
  if (isSaved(listing.id)) {
    unsaveListing(listing.id);
    return false;
  }
  saveListing(listing);
  return true;
}

export function getSavedCount(): number {
  return getAll().length;
}
