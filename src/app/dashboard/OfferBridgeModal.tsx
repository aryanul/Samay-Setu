"use client";

import { useEffect, useState } from "react";

const MAX_NOTE = 280;

export default function OfferBridgeModal({
  recipientName,
  toMemberId,
  onClose,
  onSent,
}: {
  recipientName: string;
  toMemberId: number;
  onClose: () => void;
  onSent: () => void;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit() {
    const trimmed = note.trim();
    if (trimmed.length < 6) {
      setError("Add a one-line note so they know what you're proposing.");
      return;
    }
    if (trimmed.length > MAX_NOTE) {
      setError(`Keep it under ${MAX_NOTE} characters.`);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bridges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toMemberId, note: trimmed }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        setError(result?.message || "Could not send your offer.");
        return;
      }
      onSent();
    } catch {
      setError("Network issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="bridge-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Offer a Bridge to ${recipientName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bridge-modal">
        <h3>Offer a Bridge to {recipientName}</h3>
        <p>
          One short line — what you&apos;re proposing or why you&apos;d like to talk. They can accept or decline; chat
          opens only on accept.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={MAX_NOTE + 50}
          placeholder='e.g. "I can help with SEO for an hour — would love guidance on home cooking."'
          autoFocus
        />
        {error && <p className="form-error">{error}</p>}
        <div className="bridge-modal-foot">
          <span className="char-count">
            {note.trim().length}/{MAX_NOTE}
          </span>
          <div className="bridge-modal-actions">
            <button type="button" className="dash-logout" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="button" className="tc-bridge-btn" onClick={() => void submit()} disabled={submitting}>
              {submitting ? "Sending…" : "Send offer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
