"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type BridgeRowData = {
  id: number;
  direction: "incoming" | "outgoing";
  status: "pending" | "accepted" | "declined";
  note: string;
  createdAt: string;
  other: {
    id: number;
    name: string;
    picture: string;
    headline: string;
  };
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function BridgeRow({ row }: { row: BridgeRowData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function respond(action: "accept" | "decline") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/bridges/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        setError(result?.message || "Could not update.");
        return;
      }
      if (action === "accept" && result.threadId) {
        router.push(`/dashboard/chat/${result.threadId}`);
        return;
      }
      router.refresh();
    } catch {
      setError("Network issue. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bridge-row">
      {row.other.picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="tc-avatar" src={row.other.picture} alt="" width={48} height={48} style={{ width: 48, height: 48 }} />
      ) : (
        <div className="tc-avatar" aria-hidden="true" style={{ width: 48, height: 48 }} />
      )}

      <div>
        <div className="who">{row.other.name}</div>
        <div className="meta">
          {row.other.headline ? `${row.other.headline} · ` : ""}{formatWhen(row.createdAt)}
        </div>
        <div className="note">&ldquo;{row.note}&rdquo;</div>
        {error && <p className="form-error">{error}</p>}
      </div>

      <div className="bridge-actions">
        {row.status !== "pending" ? (
          <span className={`status-tag ${row.status}`}>{row.status}</span>
        ) : row.direction === "incoming" ? (
          <>
            <button type="button" className="btn-decline" onClick={() => void respond("decline")} disabled={busy}>
              Decline
            </button>
            <button type="button" className="btn-accept" onClick={() => void respond("accept")} disabled={busy}>
              Accept
            </button>
          </>
        ) : (
          <span className="status-tag pending">awaiting</span>
        )}
      </div>
    </div>
  );
}
