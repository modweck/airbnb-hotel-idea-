import { TripForm } from "@/components/trip-form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:py-20">
      <header className="mb-10 space-y-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Find the best place for your group.
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Stop scrolling. We rank 3–5 actually good options across VRBO, Booking, and more —
          by real value, not just price.
        </p>
      </header>
      <TripForm />
    </main>
  );
}
