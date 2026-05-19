// Universal save system for listings — backed by kvStore (localStorage on web,
// AsyncStorage on native). The public API is synchronous: mutations update an
// in-memory mirror immediately and write through to kvStore in the background.

import { kvStore } from "./kv-store";

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

let mem: SavedListing[] = [];
let snapshotCache: SavedListing[] | null = null;
const EMPTY: SavedListing[] = [];
const listeners = new Set<() => void>();

async function hydrate() {
  try {
    const raw = await kvStore.getItem(STORAGE_KEY);
    mem = raw ? (JSON.parse(raw) as SavedListing[]) : [];
  } catch {
    mem = [];
  }
  invalidate();
}
void hydrate();

function persist() {
  void kvStore.setItem(STORAGE_KEY, JSON.stringify(mem)).catch(() => {});
}

function invalidate() {
  snapshotCache = null;
  listeners.forEach((l) => l());
}

export function getSavedListings(): SavedListing[] {
  if (snapshotCache === null) snapshotCache = [...mem];
  return snapshotCache;
}

export function getSavedListingsServerSnapshot(): SavedListing[] {
  return EMPTY;
}

export function subscribeSaved(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function isSaved(id: string): boolean {
  return mem.some((l) => l.id === id);
}

export function saveListing(listing: SavedListing) {
  if (mem.some((l) => l.id === listing.id)) return;
  mem = [{ ...listing, savedAt: new Date().toISOString() }, ...mem];
  persist();
  invalidate();
}

export function unsaveListing(id: string) {
  mem = mem.filter((l) => l.id !== id);
  persist();
  invalidate();
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
  return mem.length;
}
