import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { readMemberSession } from "@/lib/member-session";
import MagicLinkForm from "./MagicLinkForm";
import LinkedInLoginButton from "./LinkedInLoginButton";
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

            <LinkedInLoginButton />

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
