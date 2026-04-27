"use client";

import { useState } from "react";

export default function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus({ text: "Please enter your email.", error: true });
      return;
    }
    setStatus(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/member/magic-link/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        setStatus({ text: result?.message || "Could not send link.", error: true });
        return;
      }
      setStatus({ text: result.message || "Check your inbox.", error: false });
      setEmail("");
    } catch {
      setStatus({ text: "Network issue. Please try again.", error: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="magic-link-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="magic-email" className="magic-label">
        Email me a sign-in link
      </label>
      <div className="magic-row">
        <input
          id="magic-email"
          className="field"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <button type="submit" className="btn-solid" disabled={submitting}>
          {submitting ? "Sending…" : "Send link"}
        </button>
      </div>
      {status && (
        <p className={status.error ? "form-error" : "magic-success"} aria-live="polite">
          {status.text}
        </p>
      )}
    </form>
  );
}
