"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  getSavedListings,
  getSavedListingsServerSnapshot,
  subscribeSaved,
  unsaveListing,
} from "@/lib/saved";

export default function SavedPage() {
  const listings = useSyncExternalStore(
    subscribeSaved,
    getSavedListings,
    getSavedListingsServerSnapshot,
  );

  function handleRemove(id: string) {
    unsaveListing(id);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <Link
        href="/"
        className="mb-6 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        &larr; Back
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Saved Listings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {listings.length === 0
            ? "No saved listings yet"
            : `${listings.length} saved listing${listings.length !== 1 ? "s" : ""}`}
        </p>
      </header>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <div className="text-3xl mb-3">🔖</div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Nothing saved yet
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Search for stays and tap Save on listings you like.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start searching
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div
              key={l.id}
              className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {l.photo && (
                // Listings come from external scrapers (VRBO, Booking)
                // with arbitrary hosts; next/image would require
                // permissive remotePatterns. Plain <img> is fine here.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.photo}
                  alt={l.name}
                  className="h-28 w-40 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {l.type === "house" ? "Home" : "Hotel"}
                    </span>
                    <span className="text-xs text-zinc-500">{l.source}</span>
                  </div>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block font-semibold leading-snug text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {l.name}
                  </a>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {l.location}
                    {l.bedrooms > 0 && ` · ${l.bedrooms} bed${l.bedrooms !== 1 ? "s" : ""}`}
                    {l.bathrooms > 0 && ` · ${l.bathrooms} bath${l.bathrooms !== 1 ? "s" : ""}`}
                    {l.maxGuests > 0 && ` · sleeps ${l.maxGuests}`}
                  </p>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      ${l.nightlyPrice}
                    </span>
                    <span className="text-sm text-zinc-500"> /night</span>
                    {l.totalPrice > 0 && (
                      <span className="ml-2 text-xs text-zinc-500">
                        ${l.totalPrice.toLocaleString()} total · ${l.perPersonPrice}/person
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(l.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
            Saved listings are stored on this device. Sign in later to sync across devices.
          </p>
        </div>
      )}
    </main>
  );
}
