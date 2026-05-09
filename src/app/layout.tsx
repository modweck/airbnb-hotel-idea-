import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trip Planner — best bang for your buck",
  description:
    "AI trip planner that finds the 3–5 best stays for your group across VRBO, Booking, and more — ranked by real value.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-J7ZYR8D7LY"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-J7ZYR8D7LY');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 py-6 px-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-4">
            <a href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-300">Privacy Policy</a>
            <span>·</span>
            <a href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-300">Terms</a>
            <span>·</span>
            <a href="/contact" className="hover:text-zinc-900 dark:hover:text-zinc-300">Contact</a>
            <span>·</span>
            <a href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-300">About</a>
          </div>
          <p className="mt-3 max-w-md mx-auto text-zinc-400 dark:text-zinc-600">
            Some links on this website are affiliate links, which means we may earn a commission if you make a booking or purchase through them, at no additional cost to you. This helps support the platform and allows us to continue improving the service.
          </p>
          <p className="mt-2">&copy; {new Date().getFullYear()} [SITE NAME]</p>
        </footer>
      </body>
    </html>
  );
}
