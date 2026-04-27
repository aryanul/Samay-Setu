"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      await fetch("/api/auth/member/logout", { method: "POST" });
      router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="dash-logout" onClick={handleClick} disabled={busy}>
      {busy ? "…" : "Sign out"}
    </button>
  );
}
