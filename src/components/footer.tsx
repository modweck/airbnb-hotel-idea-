import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
] as const;

export function Footer() {
  return (
    <View className="mt-12 border-t border-zinc-200 px-6 py-6 dark:border-zinc-800">
      <View className="mx-auto w-full max-w-3xl items-center space-y-3">
        <View className="flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {LEGAL_LINKS.map((link, i) => (
            <View key={link.href} className="flex-row items-center gap-x-4">
              <Link href={link.href as never} asChild>
                <Pressable>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-500">
                    {link.label}
                  </Text>
                </Pressable>
              </Link>
              {i < LEGAL_LINKS.length - 1 && (
                <Text className="text-xs text-zinc-300 dark:text-zinc-700">
                  ·
                </Text>
              )}
            </View>
          ))}
        </View>
        <Text className="max-w-md text-center text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">
          Some links on this website are affiliate links, which means we may
          earn a commission if you make a booking or purchase through them, at
          no additional cost to you. This helps support the platform and allows
          us to continue improving the service.
        </Text>
        <Text className="text-[11px] text-zinc-400 dark:text-zinc-600">
          © {new Date().getFullYear()} [SITE NAME]
        </Text>
      </View>
    </View>
  );
}
