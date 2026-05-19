import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * Inter font — primary typeface for PropScape.
 * Weights: 400 (body), 500 (medium), 600 (semibold), 700 (bold headings).
 * See docs/design-system.md §3.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PropScape — Immobilien-Investmentanalyse",
    template: "%s | PropScape",
  },
  description:
    "Professionelle Analyse für Ihre Immobilieninvestments. Cashflow, Rendite und Steuern — alle Kennzahlen auf einen Blick.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
