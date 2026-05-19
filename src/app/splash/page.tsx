import type { Metadata } from "next";
import SplashScreen from "./SplashScreen";

export const metadata: Metadata = {
  title: "Samay Setu",
  description: "A circle of trade, not transaction.",
};

export default function SplashPage() {
  return <SplashScreen />;
}
