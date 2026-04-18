"use client";

import { useState } from "react";
import Link from "next/link";
import "./page.css";

const HUB_NAME = "North Kolkata Hub";
const HUB_DISPLAY_LOCALITIES = ["Bangur", "Lake Town", "Salt Lake"];
const INITIAL_SKILLS = ["Digital Marketing", "Home Care", "Education"];
const FOUNDING_SLOTS_REMAINING = "12/50 Remaining";
const STATUS_LABEL = "Pilot Phase (Open)";

type Answers = {
  locality: string;
  offer: string;
  need: string;
  name: string;
  whatsapp: string;
};

const STEPS = [
  { title: "Which locality do you live in?", key: "locality" as const },
  { title: "What is one professional skill or hobby you would be happy to offer?", key: "offer" as const },
  { title: "What is one thing you often wish you had help with?", key: "need" as const },
  { title: "Name and WhatsApp Number", key: "identity" as const },
];

export default function JoinCirclePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    locality: "",
    offer: "",
    need: "",
    name: "",
    whatsapp: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = STEPS.length;

  function currentStepValid(): boolean {
    const step = STEPS[currentStep];
    if (step.key === "locality") return answers.locality.trim() !== "";
    if (step.key === "offer") return answers.offer.trim().length >= 6;
    if (step.key === "need") return answers.need.trim().length >= 6;
    if (step.key === "identity") {
      const digits = answers.whatsapp.replace(/\D/g, "");
      return answers.name.trim().length >= 2 && digits.length >= 10;
    }
    return true;
  }

  function validationMessage(): string {
    if (currentStep === 0) return "Please enter your locality.";
    if (currentStep === 1) return "Please add one skill or hobby you can offer.";
    if (currentStep === 2) return "Please add one thing you often need help with.";
    if (currentStep === 3) return "Please enter your name and a valid WhatsApp number.";
    return "";
  }

  function goNext() {
    if (!currentStepValid()) {
      setError(validationMessage());
      return;
    }
    setError("");
    if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
  }

  function goBack() {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    setError("");
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentStepValid()) {
      setError(validationMessage());
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locality: answers.locality,
          offer: answers.offer,
          need: answers.need,
          name: answers.name,
          whatsapp: answers.whatsapp,
          source: "north-kolkata-qr-landing",
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        setError(result?.message || "Unable to submit right now.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network issue. Please try once again.");
    } finally {
      setSubmitting(false);
    }
  }

  const step = STEPS[currentStep];
  const progressPct = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="ss-join">
      <div className="ambient-bg" aria-hidden="true">
        <div className="ambient-grid"></div>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="page-wrap">
        <header className="topbar">
          <Link className="brand" href="/" aria-label="Samay Setu">
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" />
              <circle cx="8" cy="24" r="2.5" fill="#C9A96E" />
              <circle cx="28" cy="12" r="2.5" fill="#1a1a18" />
            </svg>
            <span className="logo-text">
              samay <span>setu</span>
            </span>
          </Link>
          <div className="pilot-chip">{HUB_NAME} Founding Circle</div>
        </header>

        <main className="hero">
          <section className="hero-left" aria-label="Landing Introduction">
            <div className="eyebrow">Immediate Recognition</div>
            <h1>Welcome, Neighbor.</h1>
            <p className="subhead">
              The <strong>{HUB_NAME} ({HUB_DISPLAY_LOCALITIES.join(" | ")})</strong> is now building its bridge.
            </p>

            <div className="ticker" aria-label="Pilot Status Ticker">
              <article className="ticker-item">
                <p className="ticker-label">Status</p>
                <p className="ticker-value">{STATUS_LABEL}</p>
              </article>
              <article className="ticker-item">
                <p className="ticker-label">Founding Slots</p>
                <p className="ticker-value">{FOUNDING_SLOTS_REMAINING}</p>
              </article>
              <article className="ticker-item">
                <p className="ticker-label">Initial Skills</p>
                <p className="ticker-value">{INITIAL_SKILLS.join(", ")}</p>
              </article>
            </div>

            <p className="hero-message">
              We are hand-selecting 50 founding members to kickstart a local economy where time is the only currency.
            </p>
          </section>

          <section className="hero-right" aria-label="Application Form Section">
            <div className="app-card">
              <span className="app-tag">Join the Circle Application</span>

              {!submitted && (
                <>
                  <div className="step-progress">
                    <div className="step-progress-head">
                      <span>Step {currentStep + 1} of {totalSteps}</span>
                      <span>Founding Intake</span>
                    </div>
                    <div className="bar">
                      <span style={{ width: `${progressPct}%` }}></span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} noValidate>
                    <div className="question">
                      <h2>{step.title}</h2>

                      {step.key === "locality" && (
                        <>
                          <input
                            className="field"
                            type="text"
                            placeholder="Type your locality"
                            value={answers.locality}
                            onChange={(e) => setAnswers({ ...answers, locality: e.target.value })}
                          />
                          <p className="hint">Example: Bangur Avenue, Lake Town, Salt Lake.</p>
                        </>
                      )}

                      {step.key === "offer" && (
                        <>
                          <textarea
                            className="field"
                            placeholder="e.g., I can give 1 hour of SEO advice"
                            value={answers.offer}
                            onChange={(e) => setAnswers({ ...answers, offer: e.target.value })}
                          />
                          <p className="hint">Specific offers help us match faster.</p>
                        </>
                      )}

                      {step.key === "need" && (
                        <>
                          <textarea
                            className="field"
                            placeholder="e.g., I need 1 hour of yoga coaching"
                            value={answers.need}
                            onChange={(e) => setAnswers({ ...answers, need: e.target.value })}
                          />
                          <p className="hint">Tell us a practical need from your weekly life.</p>
                        </>
                      )}

                      {step.key === "identity" && (
                        <>
                          <div className="two-col">
                            <input
                              className="field"
                              type="text"
                              placeholder="Your full name"
                              value={answers.name}
                              onChange={(e) => setAnswers({ ...answers, name: e.target.value })}
                            />
                            <input
                              className="field"
                              type="tel"
                              inputMode="numeric"
                              placeholder="WhatsApp number"
                              value={answers.whatsapp}
                              onChange={(e) => setAnswers({ ...answers, whatsapp: e.target.value })}
                            />
                          </div>
                          <p className="hint">We use WhatsApp only for profile verification and your private invite.</p>
                        </>
                      )}
                    </div>

                    <p className="error">{error}</p>

                    <div className="actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={goBack}
                        style={{ visibility: currentStep === 0 ? "hidden" : "visible" }}
                      >
                        Back
                      </button>
                      {currentStep < totalSteps - 1 ? (
                        <button type="button" className="btn btn-primary" onClick={goNext}>
                          Next
                        </button>
                      ) : (
                        <button type="submit" className="btn btn-success" disabled={submitting}>
                          {submitting ? "Applying..." : "Apply"}
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}

              {submitted && (
                <section className="success-screen visible" aria-live="polite">
                  <h2>Application Received.</h2>
                  <p>To keep our circle safe and high-quality, we verify every neighbor manually.</p>
                  <div className="next-steps">
                    <h3>What&apos;s next?</h3>
                    <ol>
                      <li>We will verify your profile within 24 hours.</li>
                      <li>Once approved, you will receive a 5-Hour Trust Bonus in your Samay Setu account.</li>
                      <li>You will receive a private invite to our WhatsApp Community.</li>
                    </ol>
                  </div>
                  <p className="note">Thanks for applying from the {HUB_NAME}. We value quality over quantity.</p>
                </section>
              )}
            </div>
          </section>
        </main>

        <p className="footer-note">
          Samay Setu | Trusted local time exchange for {HUB_DISPLAY_LOCALITIES.join(", ")}.
        </p>
      </div>
    </div>
  );
}
