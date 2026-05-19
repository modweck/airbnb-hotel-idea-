import { Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";

export default function AboutPage() {
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
        About Us
      </Text>

      <View className="space-y-6">
        <Text className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          [SITE NAME] was built to make finding the right stay for group travel
          easier, smarter, and more transparent.
        </Text>

        <Text className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Planning trips with friends, family, couples, or large groups can be
          frustrating — especially when trying to compare hotels, vacation
          rentals, budgets, sleeping arrangements, and total costs across
          multiple platforms.
        </Text>

        <Text className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Our goal is to simplify that process.
        </Text>

        <Text className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          [SITE NAME] helps travelers:
        </Text>

        <View className="space-y-1 pl-5">
          {[
            "Compare accommodations across providers",
            "Estimate budget per person",
            "Find better value for groups",
            "Explore hotels and vacation rentals more efficiently",
            "Make smarter travel decisions",
          ].map((item) => (
            <Text
              key={item}
              className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
            >
              {"\u2022 "}
              {item}
            </Text>
          ))}
        </View>

        <Text className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          We are focused on creating a cleaner and more user-friendly way to
          search for stays without the clutter and confusion found on many
          traditional travel sites.
        </Text>

        <Text className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Some links on the platform may be affiliate links, which means we may
          earn a commission if a booking is made through them at no additional
          cost to users.
        </Text>

        <Text className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          We are continuously improving the platform and adding new features to
          help travelers plan trips more easily.
        </Text>

        <Text className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Thank you for using [SITE NAME].
        </Text>
      </View>
    </ScrollView>
  );
}
