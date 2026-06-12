import type { Metadata } from "next";
import Link from "next/link";
import { readArchitectDraft } from "@/lib/architect-draft";
import OnboardingWizard from "./OnboardingWizard";
import "./page.css";

export const metadata: Metadata = {
  title: "Verified Architect Onboarding — Samay Setu",
  description:
    "Sign in with LinkedIn, share your expertise and your current need, and link proof of practice for Samay Setu.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; verified?: string }>;
}) {
  const draft = await readArchitectDraft();
  const sp = await searchParams;
  const initialError = typeof sp.error === "string" ? sp.error : null;
  const showVerified = sp.verified === "1";

  return (
    <div className="ss-onboard">
      <div className="nav-wrap">
        <nav className="nav">
          <Link className="brand" href="/" aria-label="Samay Setu">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12"
                stroke="#a07f3f"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="8" cy="24" r="2.5" fill="#a07f3f" />
              <circle cx="28" cy="12" r="2.5" fill="#14120e" />
            </svg>
            <span className="word">samay <em>setu</em></span>
          </Link>
          <span className="nav-tag">Verified Architect · Pilot</span>
        </nav>
      </div>

      <main className="main">
        <OnboardingWizard draft={draft} initialError={initialError} showVerified={showVerified} />
      </main>

      <div className="footer-wrap">
        <footer className="footer">
          <span>Samay Setu · North Kolkata · 2026</span>
          <em>One hour given, one hour received.</em>
        </footer>
      </div>
    </div>
  );
}
