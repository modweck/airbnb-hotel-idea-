import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
      <Link
        href="/"
        className="mb-6 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        &larr; Back
      </Link>

      <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
        Terms of Service
      </h1>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <p>
          Welcome to [SITE NAME]. By accessing or using this website, you agree
          to these Terms of Service. If you do not agree to these terms, please
          do not use the website.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Use of the Website
        </h2>
        <p>
          [SITE NAME] provides travel, accommodation, and booking comparison
          tools for informational purposes.
        </p>
        <p>
          You agree to use the website only for lawful purposes and in a way
          that does not harm the website, its users, or third parties.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Third-Party Booking Providers
        </h2>
        <p>
          [SITE NAME] may display listings, pricing, availability, and links
          from third-party providers including:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Booking.com</li>
          <li>Agoda</li>
          <li>Expedia</li>
          <li>VRBO</li>
          <li>Hotels.com</li>
          <li>Airbnb</li>
          <li>Other travel partners</li>
        </ul>
        <p>
          We do not directly provide hotel, rental, or travel services. All
          bookings, reservations, payments, cancellations, refunds, and customer
          service are handled by the third-party provider you book with.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Pricing &amp; Availability Disclaimer
        </h2>
        <p>
          Prices, availability, ratings, and listing details may change at any
          time and are provided by third parties. We do not guarantee:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Pricing accuracy</li>
          <li>Availability</li>
          <li>Listing accuracy</li>
          <li>Reservation confirmation</li>
          <li>Property quality</li>
        </ul>
        <p>
          Users should verify all booking details directly with the provider
          before completing a reservation.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Affiliate Disclosure
        </h2>
        <p>
          [SITE NAME] may earn commissions from qualifying bookings made through
          affiliate links on the website at no additional cost to users.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          User Accounts
        </h2>
        <p>
          If account features are available, you are responsible for maintaining
          the security of your account and any activity under it. You agree to
          provide accurate information and not impersonate others.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Prohibited Conduct
        </h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Use the website unlawfully</li>
          <li>Attempt to disrupt or damage the website</li>
          <li>Scrape or copy website content without permission</li>
          <li>Use automated bots in violation of applicable laws</li>
          <li>Interfere with website functionality or security</li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Intellectual Property
        </h2>
        <p>
          All website content, branding, design, logos, text, and features are
          owned by or licensed to [SITE NAME] and may not be copied or
          reproduced without permission.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Limitation of Liability
        </h2>
        <p>
          [SITE NAME] is provided &ldquo;as is&rdquo; without warranties of any
          kind. To the maximum extent permitted by law, we are not liable for:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Booking issues</li>
          <li>Pricing errors</li>
          <li>Travel disruptions</li>
          <li>Third-party provider actions</li>
          <li>Losses or damages resulting from use of the website</li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Changes to the Service
        </h2>
        <p>
          We may modify, suspend, or discontinue parts of the website at any
          time without notice.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Changes to These Terms
        </h2>
        <p>
          We may update these Terms of Service from time to time. Continued use
          of the website after updates constitutes acceptance of the revised
          terms.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Contact
        </h2>
        <p>
          If you have questions about these Terms, contact us at:
        </p>
        <p>
          [CONTACT EMAIL]<br />
          [WEBSITE URL]
        </p>
      </div>
    </main>
  );
}
