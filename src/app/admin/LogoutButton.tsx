"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="logout-form" onSubmit={(e) => e.preventDefault()}>
      <button type="button" onClick={handleClick} disabled={busy}>
        {busy ? "Logging out..." : "Logout"}
      </button>
    </form>
  );
}
