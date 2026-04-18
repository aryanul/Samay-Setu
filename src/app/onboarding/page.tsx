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
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="page-wrap">
        <header className="topbar">
          <Link className="brand" href="/" aria-label="Samay Setu">
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12"
                stroke="#C9A96E"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="8" cy="24" r="2.5" fill="#C9A96E" />
              <circle cx="28" cy="12" r="2.5" fill="#1a1a18" />
            </svg>
            <span className="logo-text">
              samay <span>setu</span>
            </span>
          </Link>
          <div className="pilot-chip">Verified Architect · Pilot</div>
        </header>

        <main className="onboard-main">
          <OnboardingWizard draft={draft} initialError={initialError} showVerified={showVerified} />
        </main>
      </div>
    </div>
  );
}
