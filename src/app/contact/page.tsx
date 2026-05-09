import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default function ContactPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <Link
        href="/"
        className="mb-6 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        &larr; Back
      </Link>

      <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
        Contact Us
      </h1>
      <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
        We&apos;d love to hear from you.
      </p>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <p>
          If you have questions, feedback, partnership inquiries, or need
          support, feel free to reach out.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          General Inquiries
        </h2>
        <p>
          Email: [CONTACT EMAIL]
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Partnerships &amp; Business
        </h2>
        <p>
          For affiliate, partnership, or business-related inquiries, please
          contact:
        </p>
        <p>[BUSINESS EMAIL]</p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Support
        </h2>
        <p>
          If you are experiencing issues with the website or have questions
          about listings or bookings, please contact:
        </p>
        <p>[SUPPORT EMAIL]</p>
        <p>We aim to respond as soon as possible.</p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          About [SITE NAME]
        </h2>
        <p>
          [SITE NAME] helps travelers find and compare accommodations for group
          trips, budget planning, and smarter travel decisions.
        </p>
      </div>
    </main>
  );
}
