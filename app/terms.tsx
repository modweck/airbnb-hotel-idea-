import { Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";

function H2({ children }: { children: string }) {
  return (
    <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
      {children}
    </Text>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      {children}
    </Text>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View className="space-y-1 pl-5">
      {items.map((item) => (
        <Text
          key={item}
          className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
        >
          {"\u2022 "}
          {item}
        </Text>
      ))}
    </View>
  );
}

export default function TermsPage() {
  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-950"
      contentContainerClassName="mx-auto w-full max-w-3xl px-6 py-10"
    >
      <Link href={"/" as never} asChild>
        <Pressable className="mb-6">
          <Text className="text-sm text-zinc-600 dark:text-zinc-400">
            ← Back
          </Text>
        </Pressable>
      </Link>

      <Text className="mb-8 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        Terms of Service
      </Text>

      <View className="space-y-6">
        <P>
          Welcome to [SITE NAME]. By accessing or using this website, you agree
          to these Terms of Service. If you do not agree to these terms, please
          do not use the website.
        </P>

        <H2>Use of the Website</H2>
        <P>
          [SITE NAME] provides travel, accommodation, and booking comparison
          tools for informational purposes.
        </P>
        <P>
          You agree to use the website only for lawful purposes and in a way
          that does not harm the website, its users, or third parties.
        </P>

        <H2>Third-Party Booking Providers</H2>
        <P>
          [SITE NAME] may display listings, pricing, availability, and links
          from third-party providers including:
        </P>
        <Bullets
          items={[
            "Booking.com",
            "Agoda",
            "Expedia",
            "VRBO",
            "Hotels.com",
            "Airbnb",
            "Other travel partners",
          ]}
        />
        <P>
          We do not directly provide hotel, rental, or travel services. All
          bookings, reservations, payments, cancellations, refunds, and
          customer service are handled by the third-party provider you book
          with.
        </P>

        <H2>Pricing &amp; Availability Disclaimer</H2>
        <P>
          Prices, availability, ratings, and listing details may change at any
          time and are provided by third parties. We do not guarantee:
        </P>
        <Bullets
          items={[
            "Pricing accuracy",
            "Availability",
            "Listing accuracy",
            "Reservation confirmation",
            "Property quality",
          ]}
        />
        <P>
          Users should verify all booking details directly with the provider
          before completing a reservation.
        </P>

        <H2>Affiliate Disclosure</H2>
        <P>
          [SITE NAME] may earn commissions from qualifying bookings made
          through affiliate links on the website at no additional cost to
          users.
        </P>

        <H2>User Accounts</H2>
        <P>
          If account features are available, you are responsible for
          maintaining the security of your account and any activity under it.
          You agree to provide accurate information and not impersonate others.
        </P>

        <H2>Prohibited Conduct</H2>
        <P>You agree not to:</P>
        <Bullets
          items={[
            "Use the website unlawfully",
            "Attempt to disrupt or damage the website",
            "Scrape or copy website content without permission",
            "Use automated bots in violation of applicable laws",
            "Interfere with website functionality or security",
          ]}
        />

        <H2>Intellectual Property</H2>
        <P>
          All website content, branding, design, logos, text, and features are
          owned by or licensed to [SITE NAME] and may not be copied or
          reproduced without permission.
        </P>

        <H2>Limitation of Liability</H2>
        <P>
          [SITE NAME] is provided &ldquo;as is&rdquo; without warranties of any
          kind. To the maximum extent permitted by law, we are not liable for:
        </P>
        <Bullets
          items={[
            "Booking issues",
            "Pricing errors",
            "Travel disruptions",
            "Third-party provider actions",
            "Losses or damages resulting from use of the website",
          ]}
        />

        <H2>Changes to the Service</H2>
        <P>
          We may modify, suspend, or discontinue parts of the website at any
          time without notice.
        </P>

        <H2>Changes to These Terms</H2>
        <P>
          We may update these Terms of Service from time to time. Continued use
          of the website after updates constitutes acceptance of the revised
          terms.
        </P>

        <H2>Contact</H2>
        <P>If you have questions about these Terms, contact us at:</P>
        <P>[CONTACT EMAIL]</P>
        <P>[WEBSITE URL]</P>
      </View>
    </ScrollView>
  );
}
