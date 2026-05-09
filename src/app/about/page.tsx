import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <Link
        href="/"
        className="mb-6 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        &larr; Back
      </Link>

      <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
        About Us
      </h1>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <p>
          [SITE NAME] was built to make finding the right stay for group travel
          easier, smarter, and more transparent.
        </p>

        <p>
          Planning trips with friends, family, couples, or large groups can be
          frustrating — especially when trying to compare hotels, vacation
          rentals, budgets, sleeping arrangements, and total costs across
          multiple platforms.
        </p>

        <p>Our goal is to simplify that process.</p>

        <p>[SITE NAME] helps travelers:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Compare accommodations across providers</li>
          <li>Estimate budget per person</li>
          <li>Find better value for groups</li>
          <li>Explore hotels and vacation rentals more efficiently</li>
          <li>Make smarter travel decisions</li>
        </ul>

        <p>
          We are focused on creating a cleaner and more user-friendly way to
          search for stays without the clutter and confusion found on many
          traditional travel sites.
        </p>

        <p>
          Some links on the platform may be affiliate links, which means we may
          earn a commission if a booking is made through them at no additional
          cost to users.
        </p>

        <p>
          We are continuously improving the platform and adding new features to
          help travelers plan trips more easily.
        </p>

        <p>Thank you for using [SITE NAME].</p>
      </div>
    </main>
  );
}
