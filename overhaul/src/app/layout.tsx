import type { Metadata } from "next";
import { Inter, Crimson_Text } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const crimsonText = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chief's Music | Guitar Teacher & Musician",
  description: "Professional guitar lessons and original music by Chief (Matai Cross). Learn classical guitar, watch performances, and book private lessons.",
  keywords: ["guitar teacher", "classical guitar", "music lessons", "Chief", "Matai Cross"],
  authors: [{ name: "Matai Cross" }],
  openGraph: {
    title: "Chief's Music | Guitar Teacher & Musician",
    description: "Professional guitar lessons and original music by Chief (Matai Cross)",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${crimsonText.variable} font-sans antialiased bg-stone-50`}
      >
        {children}
      </body>
    </html>
  );
}
