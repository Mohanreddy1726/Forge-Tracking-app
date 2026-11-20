import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Forge — Build Yourself. Every Day.",
  description:
    "Forge is a premium 180-day transformation tracker for weight loss, habits, workouts and discipline.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Forge",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    title: "Forge — Build Yourself. Every Day.",
    description:
      "A premium 180-day transformation tracker: weight trends, habit scoring, streaks, workouts and beautiful analytics.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forge — Build Yourself. Every Day.",
    description:
      "A premium 180-day transformation tracker: weight trends, habit scoring, streaks, workouts and beautiful analytics.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${outfit.variable} ${jetbrains.variable}`}>
      <body className="bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
