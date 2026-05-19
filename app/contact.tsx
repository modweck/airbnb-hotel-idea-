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

export default function ContactPage() {
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

      <Text className="mb-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        Contact Us
      </Text>
      <Text className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
        We&apos;d love to hear from you.
      </Text>

      <View className="space-y-6">
        <P>
          If you have questions, feedback, partnership inquiries, or need
          support, feel free to reach out.
        </P>

        <H2>General Inquiries</H2>
        <P>Email: [CONTACT EMAIL]</P>

        <H2>Partnerships &amp; Business</H2>
        <P>
          For affiliate, partnership, or business-related inquiries, please
          contact:
        </P>
        <P>[BUSINESS EMAIL]</P>

        <H2>Support</H2>
        <P>
          If you are experiencing issues with the website or have questions
          about listings or bookings, please contact:
        </P>
        <P>[SUPPORT EMAIL]</P>
        <P>We aim to respond as soon as possible.</P>

        <H2>About [SITE NAME]</H2>
        <P>
          [SITE NAME] helps travelers find and compare accommodations for group
          trips, budget planning, and smarter travel decisions.
        </P>
      </View>
    </ScrollView>
  );
}
