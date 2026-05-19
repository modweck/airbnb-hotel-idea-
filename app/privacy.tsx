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

export default function PrivacyPage() {
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
        Privacy Policy
      </Text>

      <View className="space-y-6">
        <P>
          Welcome to [SITE NAME]. Your privacy is important to us. This Privacy
          Policy explains what information we collect and how we use it when
          you use our website.
        </P>

        <H2>Information We Collect</H2>
        <P>We may collect:</P>
        <Bullets
          items={[
            "Basic account information such as name and email address",
            "Search and trip preferences",
            "Device and browser information",
            "IP address and approximate location",
            "Website usage data and analytics",
          ]}
        />

        <H2>How We Use Information</H2>
        <P>We use information to:</P>
        <Bullets
          items={[
            "Improve the website and user experience",
            "Provide travel and accommodation search features",
            "Analyze traffic and site performance",
            "Track affiliate link performance",
            "Respond to support requests",
            "Prevent fraud and abuse",
          ]}
        />

        <H2>Affiliate Links</H2>
        <P>
          [SITE NAME] may contain affiliate links to third-party travel
          providers including Booking.com, Agoda, Expedia, VRBO, Hotels.com,
          Airbnb, and other partners.
        </P>
        <P>
          If you click on an affiliate link and make a booking, we may earn a
          commission at no additional cost to you.
        </P>
        <P>
          Prices and availability are provided by third parties and may change
          at any time.
        </P>

        <H2>Cookies &amp; Analytics</H2>
        <P>
          We may use cookies, analytics tools, and similar technologies to
          improve the website and understand how users interact with the
          platform. We may use services such as Google Analytics.
        </P>

        <H2>Third-Party Websites</H2>
        <P>
          Our website may link to third-party websites. We are not responsible
          for the privacy practices, content, or services of those websites.
        </P>

        <H2>Data Security</H2>
        <P>
          We take reasonable measures to help protect your information, but no
          method of transmission over the internet is completely secure.
        </P>

        <H2>Children&apos;s Privacy</H2>
        <P>This website is not intended for children under 13 years old.</P>

        <H2>Changes to This Policy</H2>
        <P>
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page.
        </P>

        <H2>Contact</H2>
        <P>If you have questions about this Privacy Policy, contact us at:</P>
        <P>[CONTACT EMAIL]</P>
        <P>[WEBSITE URL]</P>
      </View>
    </ScrollView>
  );
}
