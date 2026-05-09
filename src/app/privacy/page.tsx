import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <Link
        href="/"
        className="mb-6 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        &larr; Back
      </Link>

      <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
        Privacy Policy
      </h1>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <p>
          Welcome to [SITE NAME]. Your privacy is important to us. This Privacy
          Policy explains what information we collect and how we use it when you
          use our website.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Information We Collect
        </h2>
        <p>We may collect:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Basic account information such as name and email address</li>
          <li>Search and trip preferences</li>
          <li>Device and browser information</li>
          <li>IP address and approximate location</li>
          <li>Website usage data and analytics</li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          How We Use Information
        </h2>
        <p>We use information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Improve the website and user experience</li>
          <li>Provide travel and accommodation search features</li>
          <li>Analyze traffic and site performance</li>
          <li>Track affiliate link performance</li>
          <li>Respond to support requests</li>
          <li>Prevent fraud and abuse</li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Affiliate Links
        </h2>
        <p>
          [SITE NAME] may contain affiliate links to third-party travel
          providers including Booking.com, Agoda, Expedia, VRBO, Hotels.com,
          Airbnb, and other partners.
        </p>
        <p>
          If you click on an affiliate link and make a booking, we may earn a
          commission at no additional cost to you.
        </p>
        <p>
          Prices and availability are provided by third parties and may change at
          any time.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Cookies &amp; Analytics
        </h2>
        <p>
          We may use cookies, analytics tools, and similar technologies to
          improve the website and understand how users interact with the
          platform. We may use services such as Google Analytics.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Third-Party Websites
        </h2>
        <p>
          Our website may link to third-party websites. We are not responsible
          for the privacy practices, content, or services of those websites.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Data Security
        </h2>
        <p>
          We take reasonable measures to help protect your information, but no
          method of transmission over the internet is completely secure.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Children&apos;s Privacy
        </h2>
        <p>
          This website is not intended for children under 13 years old.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Changes to This Policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Contact
        </h2>
        <p>
          If you have questions about this Privacy Policy, contact us at:
        </p>
        <p>
          [CONTACT EMAIL]<br />
          [WEBSITE URL]
        </p>
      </div>
    </main>
  );
}
