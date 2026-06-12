"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ArchitectDraft } from "@/lib/architect-draft";

const DONE_KEY = "ss_architect_onboarding_done";
const DONE_NAME_KEY = "ss_architect_onboarding_done_name";

const STEPS = [
  { id: 1, label: "The Giver", title: "Primary expertise", pillar: "What you give" },
  { id: 2, label: "The Seeker", title: "Current need", pillar: "What you seek" },
  { id: 3, label: "Proof of practice", title: "Proof of wisdom", pillar: "Verify your craft" },
] as const;

function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  const map: Record<string, string> = {
    config:
      "LinkedIn is not configured on this server. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET (locally in .env.local, or in Vercel → Settings → Environment Variables), then redeploy / restart.",
    invalid_state: "Sign-in expired. Please try LinkedIn again.",
    callback_failed: "We could not complete LinkedIn sign-in. Please try again.",
    access_denied: "LinkedIn sign-in was cancelled.",
    user_cancelled_login: "LinkedIn sign-in was cancelled.",
  };
  return map[code] ?? "Something went wrong with LinkedIn. Please try again.";
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function OnboardingWizard({
  draft,
  initialError,
  showVerified,
}: {
  draft: ArchitectDraft | null;
  initialError: string | null;
  showVerified: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [primaryExpertise, setPrimaryExpertise] = useState("");
  const [currentNeed, setCurrentNeed] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [doneName, setDoneName] = useState<string | null>(null);

  const oauthMsg = useMemo(() => oauthErrorMessage(initialError), [initialError]);
  const displayError = error || oauthMsg || "";

  useEffect(() => {
    startTransition(() => {
      try {
        if (typeof window !== "undefined" && window.sessionStorage.getItem(DONE_KEY) === "1") {
          setDone(true);
          setDoneName(window.sessionStorage.getItem(DONE_NAME_KEY));
        }
      } catch {
        /* ignore */
      }
    });
  }, []);

  useEffect(() => {
    if (showVerified) {
      router.replace("/onboarding", { scroll: false });
    }
  }, [showVerified, router]);

  async function disconnect() {
    setError("");
    try {
      await fetch("/api/auth/linkedin/disconnect", { method: "POST" });
      try {
        window.sessionStorage.removeItem(DONE_KEY);
        window.sessionStorage.removeItem(DONE_NAME_KEY);
      } catch {
        /* ignore */
      }
      setDone(false);
      setDoneName(null);
      router.refresh();
    } catch {
      setError("Could not reset session. Please refresh the page.");
    }
  }

  function validateStep(n: number): string | null {
    if (n === 1) {
      if (primaryExpertise.trim().length < 3) return "Add your primary area of expertise.";
      return null;
    }
    if (n === 2) {
      if (currentNeed.trim().length < 6) return "Describe a concrete need (one sentence is enough).";
      return null;
    }
    if (n === 3) {
      const u = proofUrl.trim();
      if (!u) return "Link to a LinkedIn post or article that shows your practice.";
      try {
        const parsed = new URL(u);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return "Use an http(s) link.";
        }
      } catch {
        return "Enter a valid URL.";
      }
      return null;
    }
    return null;
  }

  function next() {
    const msg = validateStep(step);
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    if (step < 3) setStep(step + 1);
  }

  function back() {
    setError("");
    if (step > 1) setStep(step - 1);
  }

  async function submit() {
    if (!draft) {
      setError("Please sign in with LinkedIn again.");
      return;
    }
    const msg = validateStep(3);
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryExpertise: primaryExpertise.trim(),
          currentNeed: currentNeed.trim(),
          proofOfWisdomUrl: proofUrl.trim(),
          source: "verified-architect-onboarding",
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        setError(result?.message || "Unable to submit right now.");
        return;
      }
      const nameForThanks =
        typeof result.displayName === "string" && result.displayName.trim()
          ? result.displayName.trim()
          : draft.name;
      try {
        window.sessionStorage.setItem(DONE_KEY, "1");
        window.sessionStorage.setItem(DONE_NAME_KEY, nameForThanks);
      } catch {
        /* ignore */
      }
      setDoneName(nameForThanks);
      setDone(true);
      const redirectTo = typeof result.redirect === "string" ? result.redirect : null;
      if (redirectTo) {
        window.setTimeout(() => {
          try {
            window.sessionStorage.removeItem(DONE_KEY);
            window.sessionStorage.removeItem(DONE_NAME_KEY);
          } catch {
            /* ignore */
          }
          router.push(redirectTo);
        }, 1500);
      } else {
        router.refresh();
      }
    } catch {
      setError("Network issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const thankName = (doneName || draft?.name || "there").trim();
    return (
      <article className="card success-card">
        <p className="card-pillar">Welcome</p>
        <h2>You&apos;re in, <em>{thankName}.</em></h2>
        <p className="card-hint">
          Opening the Live Bridge — your members-only feed of trade cards…
        </p>
        <p className="card-sub">If nothing happens in a moment, tap below.</p>
        <div className="card-actions card-actions-end">
          <Link
            className="btn-continue"
            href="/dashboard"
            onClick={() => {
              try {
                window.sessionStorage.removeItem(DONE_KEY);
                window.sessionStorage.removeItem(DONE_NAME_KEY);
              } catch {
                /* ignore */
              }
            }}
          >
            Enter the Bridge →
          </Link>
        </div>
      </article>
    );
  }

  if (!draft) {
    return (
      <article className="card gate-card">
        <p className="card-pillar">Verified Architect</p>
        <h2>Professional <em>onboarding</em></h2>
        <p className="card-hint">
          We verify every member like a trusted practice — not a mass signup. Start by authenticating with LinkedIn so we can
          pull your name, title, and profile photo automatically.
        </p>
        <ul className="gate-checklist">
          <li>LinkedIn identity (OpenID)</li>
          <li>The Giver pillar — your primary expertise</li>
          <li>The Seeker pillar — your current need</li>
          <li>Proof of wisdom — one post or article</li>
        </ul>
        {displayError && <p className="form-error">{displayError}</p>}
        <button
          type="button"
          className="btn-linkedin"
          onClick={() => {
            window.location.href = "/api/auth/linkedin";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
            />
          </svg>
          Continue with LinkedIn
        </button>
        <p className="micro">
          We use LinkedIn only for verification-style onboarding. By continuing you agree to share basic profile fields allowed by
          your LinkedIn settings.
        </p>
        <p className="micro">
          <Link className="text-link" href="/">
            ← Back to Samay Setu
          </Link>
        </p>
      </article>
    );
  }

  const meta = STEPS[step - 1];

  return (
    <>
      <div className="identity">
        {draft.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar avatar-img" src={draft.picture} alt="" width={56} height={56} />
        ) : (
          <div className="avatar" aria-hidden="true">{initialsOf(draft.name)}</div>
        )}
        <div className="identity-body">
          <div className="identity-name">{draft.name}</div>
          {draft.headline ? (
            <div className="identity-title">{draft.headline} · pulled from LinkedIn</div>
          ) : (
            <div className="identity-title subtle">Title not provided by LinkedIn — you may describe expertise below.</div>
          )}
        </div>
        <button type="button" className="identity-reset" onClick={() => void disconnect()}>
          Not you?
        </button>
      </div>

      <div className="step-rail">
        {STEPS.map((s) => (
          <div key={s.id} className={`step${s.id === step ? " active" : ""}${s.id < step ? " done" : ""}`}>
            <div className="n">{s.id}</div>
            <div className="body">
              <span className="pillar">{s.label}</span>
              <span className="label">{s.title}</span>
            </div>
          </div>
        ))}
      </div>

      <article className="card">
        <p className="card-pillar">{meta.pillar}</p>
        <h2>{meta.title}</h2>
        <p className="card-hint">
          {step === 1 && "Choose the one domain you would list on a business card — taxation, coaching, design, care work, and so on."}
          {step === 2 && "What would you book a 1:1 for? Be specific — it helps future matches."}
          {step === 3 && "Paste a public LinkedIn post or article that demonstrates how you think or practice."}
        </p>

        {step === 1 && (
          <input
            className="card-field"
            type="text"
            autoComplete="off"
            placeholder="e.g. GST taxation · Strength coaching · HR strategy"
            value={primaryExpertise}
            onChange={(e) => setPrimaryExpertise(e.target.value)}
          />
        )}
        {step === 2 && (
          <textarea
            className="card-field"
            placeholder='e.g. "I need a 1:1 on leadership management for a small team"'
            value={currentNeed}
            onChange={(e) => setCurrentNeed(e.target.value)}
          />
        )}
        {step === 3 && (
          <input
            className="card-field"
            type="url"
            inputMode="url"
            placeholder="https://www.linkedin.com/posts/..."
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
          />
        )}

        {displayError && <p className="form-error">{displayError}</p>}

        <div className="card-actions">
          <button
            type="button"
            className="btn-back"
            onClick={back}
            style={{ visibility: step === 1 ? "hidden" : "visible" }}
          >
            ← Back
          </button>
          {step < 3 ? (
            <button type="button" className="btn-continue" onClick={next}>
              Continue →
            </button>
          ) : (
            <button type="button" className="btn-continue" onClick={() => void submit()} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit verification →"}
            </button>
          )}
        </div>
      </article>

      <p className="micro">
        Your responses stay private until your verification is complete. <strong>Two members</strong> are currently in onboarding ahead of you.
      </p>
    </>
  );
}
