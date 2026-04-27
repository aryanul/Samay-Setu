import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { readMemberSession } from "@/lib/member-session";
import MagicLinkForm from "./MagicLinkForm";
import "../onboarding/page.css";
import "./page.css";

export const metadata: Metadata = {
  title: "Sign in — Samay Setu",
  description: "Sign in to Samay Setu with LinkedIn or an email link.",
};

export const dynamic = "force-dynamic";

const LOGIN_ERRORS: Record<string, string> = {
  expired: "That sign-in link has expired or already been used. Please request a new one.",
  missing_token: "Sign-in link was incomplete. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await readMemberSession();
  if (session) {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const initialError =
    typeof sp.error === "string" && sp.error in LOGIN_ERRORS ? LOGIN_ERRORS[sp.error] : null;

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
          <div className="pilot-chip">Members</div>
        </header>

        <main className="onboard-main">
          <div className="ss-onboard-gate">
            <div className="verify-badge">Welcome back</div>
            <h1>Sign in to Samay Setu</h1>
            <p className="lead">
              Continue with the same LinkedIn you joined with, or have us email you a one-tap sign-in link.
            </p>

            {initialError && <p className="form-error">{initialError}</p>}

            <a className="btn-linkedin" href="/api/auth/linkedin">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                />
              </svg>
              Continue with LinkedIn
            </a>

            <div className="login-divider">
              <span>or</span>
            </div>

            <MagicLinkForm />

            <p className="fineprint">
              Not a member yet?{" "}
              <Link className="text-link" href="/onboarding" style={{ marginTop: 0 }}>
                Apply for Verified Architect onboarding →
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
