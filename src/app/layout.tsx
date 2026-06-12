import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppSplash from "./AppSplash";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Samay Setu — Trade Time, Not Money",
  description:
    "A private exchange for your neighbourhood. Trade your professional skills for local help — no money, just minutes.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <AppSplash>{children}</AppSplash>
      </body>
    </html>
  );
}
