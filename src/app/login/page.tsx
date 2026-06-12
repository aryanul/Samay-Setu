import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { readMemberSession } from "@/lib/member-session";
import MagicLinkForm from "./MagicLinkForm";
import LinkedInLoginButton from "./LinkedInLoginButton";
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
    <div className="ss-login">
      <div className="nav-wrap">
        <nav className="nav">
          <Link className="brand" href="/" aria-label="Samay Setu">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" stroke="#a07f3f" strokeWidth="2" strokeLinecap="round" />
              <circle cx="8" cy="24" r="2.5" fill="#a07f3f" />
              <circle cx="28" cy="12" r="2.5" fill="#14120e" />
            </svg>
            <span className="word">samay <em>setu</em></span>
          </Link>
          <span className="nav-tag">Members</span>
          <Link className="back-link" href="/">← Back</Link>
        </nav>
      </div>

      <main className="main">
        <div className="card">
          <span className="card-tag">Welcome back</span>
          <h1>Sign in to <em>Samay&nbsp;Setu</em></h1>
          <p className="lede">
            Continue with the LinkedIn you joined with, or we&apos;ll email you a one-tap sign-in link.
          </p>

          {initialError && <p className="form-error">{initialError}</p>}

          <LinkedInLoginButton />

          <div className="divider"><span>or</span></div>

          <MagicLinkForm />

          <div className="alt">
            Not a member yet? <Link href="/onboarding">Apply for onboarding →</Link>
          </div>
        </div>
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
