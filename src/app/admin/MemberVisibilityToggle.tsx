"use client";

import { useState } from "react";

export default function MemberVisibilityToggle({
  memberId,
  initialVisible,
}: {
  memberId: number;
  initialVisible: boolean;
}) {
  const [visible, setVisible] = useState(initialVisible);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !visible;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/members/${memberId}/visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: next }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        return;
      }
      setVisible(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      style={{
        border: visible ? "1px solid rgba(127,166,125,0.5)" : "1px solid #c5b899",
        background: visible ? "rgba(127,166,125,0.16)" : "#e0d4b8",
        color: visible ? "#4d7a4b" : "#6e6552",
        padding: "4px 10px",
        borderRadius: 999,
        cursor: "pointer",
        fontSize: "0.8rem",
        textTransform: "none",
        letterSpacing: "normal",
        fontWeight: 600,
      }}
    >
      {busy ? "…" : visible ? "Visible" : "Hidden"}
    </button>
  );
}
