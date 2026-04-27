"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  primaryExpertise: string;
  currentNeed: string;
  proofOfWisdomUrl: string;
};

export default function EditMeForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [primaryExpertise, setPrimaryExpertise] = useState(initial.primaryExpertise);
  const [currentNeed, setCurrentNeed] = useState(initial.currentNeed);
  const [proofOfWisdomUrl, setProofOfWisdomUrl] = useState(initial.proofOfWisdomUrl);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);

  async function submit() {
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryExpertise, currentNeed, proofOfWisdomUrl }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        setStatus({ text: result?.message || "Could not save.", error: true });
        return;
      }
      setStatus({ text: "Saved.", error: false });
      router.refresh();
    } catch {
      setStatus({ text: "Network issue. Please try again.", error: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label htmlFor="primaryExpertise">Gives — your primary expertise</label>
      <input
        id="primaryExpertise"
        className="field"
        type="text"
        value={primaryExpertise}
        onChange={(e) => setPrimaryExpertise(e.target.value)}
      />

      <label htmlFor="currentNeed">Seeks — what you currently need</label>
      <textarea
        id="currentNeed"
        className="field area"
        value={currentNeed}
        onChange={(e) => setCurrentNeed(e.target.value)}
      />

      <label htmlFor="proofOfWisdomUrl">Proof of practice</label>
      <input
        id="proofOfWisdomUrl"
        className="field"
        type="url"
        inputMode="url"
        value={proofOfWisdomUrl}
        onChange={(e) => setProofOfWisdomUrl(e.target.value)}
      />

      {status && (
        <p className={status.error ? "form-error" : "magic-success"} aria-live="polite">
          {status.text}
        </p>
      )}

      <div className="row">
        <button type="submit" className="tc-bridge-btn" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
