import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Prep Triathlon — Plan 12 semaines",
  description:
    "Plan d'entraînement triathlon M-Olympia — natation, vélo, course, nutrition, mental",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={dmSans.variable} suppressHydrationWarning>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <div className="app-bg" aria-hidden />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
