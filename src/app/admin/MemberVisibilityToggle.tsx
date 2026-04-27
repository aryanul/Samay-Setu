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
        border: "1px solid rgba(0,0,0,0.15)",
        background: visible ? "rgba(31,77,58,0.12)" : "rgba(139,46,46,0.08)",
        color: visible ? "#1f4d3a" : "#8b2e2e",
        padding: "4px 10px",
        borderRadius: 999,
        cursor: "pointer",
        fontSize: "0.8rem",
      }}
    >
      {busy ? "…" : visible ? "Visible" : "Hidden"}
    </button>
  );
}
