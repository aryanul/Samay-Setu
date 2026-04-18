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
      "LinkedIn is not configured yet. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to .env.local (see .env.example), then restart the dev server.",
    invalid_state: "Sign-in expired. Please try LinkedIn again.",
    callback_failed: "We could not complete LinkedIn sign-in. Please try again.",
    access_denied: "LinkedIn sign-in was cancelled.",
    user_cancelled_login: "LinkedIn sign-in was cancelled.",
  };
  return map[code] ?? "Something went wrong with LinkedIn. Please try again.";
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
      router.refresh();
    } catch {
      setError("Network issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const thankName = (doneName || draft?.name || "there").trim();
    return (
      <div className="ss-onboard-success">
        <div className="verify-badge muted">Received</div>
        <h1>Verification dossier received</h1>
        <p className="lead">
          Thank you, <strong>{thankName}</strong>. Our team reviews each Verified Architect application by hand to keep the circle
          safe and high-trust.
        </p>
        <p className="sub">You will hear from us once your profile is cleared for the pilot.</p>
        <Link
          className="btn-primary-outline"
          href="/"
          onClick={() => {
            try {
              window.sessionStorage.removeItem(DONE_KEY);
              window.sessionStorage.removeItem(DONE_NAME_KEY);
            } catch {
              /* ignore */
            }
          }}
        >
          Return home
        </Link>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="ss-onboard-gate">
        <div className="verify-badge">Verified Architect</div>
        <h1>Professional onboarding</h1>
        <p className="lead">
          We verify every member like a trusted practice — not a mass signup. Start by authenticating with LinkedIn so we can
          pull your name, title, and profile photo automatically.
        </p>
        <ul className="checklist">
          <li>LinkedIn identity (OpenID)</li>
          <li>The Giver pillar — your primary expertise</li>
          <li>The Seeker pillar — your current need</li>
          <li>Proof of wisdom — one post or article</li>
        </ul>
        {displayError && <p className="form-error">{displayError}</p>}
        <a className="btn-linkedin" href="/api/auth/linkedin">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
            />
          </svg>
          Continue with LinkedIn
        </a>
        <p className="fineprint">
          We use LinkedIn only for verification-style onboarding. By continuing you agree to share basic profile fields allowed by
          your LinkedIn settings.
        </p>
        <Link className="text-link" href="/">
          ← Back to Samay Setu
        </Link>
      </div>
    );
  }

  const meta = STEPS[step - 1];

  return (
    <div className="ss-onboard-flow">
      <div className="identity-strip">
        <div className="avatar-wrap">
          {draft.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="avatar" src={draft.picture} alt="" width={72} height={72} />
          ) : (
            <div className="avatar placeholder" aria-hidden="true" />
          )}
        </div>
        <div>
          <p className="identity-name">{draft.name}</p>
          {draft.headline && <p className="identity-title">{draft.headline}</p>}
          {!draft.headline && <p className="identity-title subtle">Title not provided by LinkedIn — you may describe expertise below.</p>}
        </div>
        <button type="button" className="btn-text" onClick={() => void disconnect()}>
          Not you?
        </button>
      </div>

      <div className="step-rail" aria-hidden="true">
        {STEPS.map((s) => (
          <div key={s.id} className={`step-pill${s.id === step ? " active" : ""}${s.id < step ? " done" : ""}`}>
            <span className="num">{s.id}</span>
            <span className="lbl">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="pillar-card">
        <p className="pillar-tag">{meta.pillar}</p>
        <h2>{meta.title}</h2>
        <p className="pillar-hint">
          {step === 1 && "Choose the one domain you would list on a business card — taxation, coaching, design, care work, and so on."}
          {step === 2 && "What would you book a 1:1 for? Be specific — it helps future matches."}
          {step === 3 && "Paste a public LinkedIn post or article that demonstrates how you think or practice."}
        </p>

        {step === 1 && (
          <input
            className="field"
            type="text"
            autoComplete="off"
            placeholder="e.g. GST taxation · Strength coaching · HR strategy"
            value={primaryExpertise}
            onChange={(e) => setPrimaryExpertise(e.target.value)}
          />
        )}
        {step === 2 && (
          <textarea
            className="field area"
            placeholder='e.g. "I need a 1:1 on leadership management for a small team"'
            value={currentNeed}
            onChange={(e) => setCurrentNeed(e.target.value)}
          />
        )}
        {step === 3 && (
          <input
            className="field"
            type="url"
            inputMode="url"
            placeholder="https://www.linkedin.com/posts/..."
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
          />
        )}

        {displayError && <p className="form-error">{displayError}</p>}

        <div className="actions">
          <button type="button" className="btn-ghost" onClick={back} style={{ visibility: step === 1 ? "hidden" : "visible" }}>
            Back
          </button>
          {step < 3 ? (
            <button type="button" className="btn-solid" onClick={next}>
              Continue
            </button>
          ) : (
            <button type="button" className="btn-solid" onClick={() => void submit()} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit verification"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
