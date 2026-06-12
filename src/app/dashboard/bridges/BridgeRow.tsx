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

function initial(name: string): string {
  const c = name.trim()[0];
  return c ? c.toUpperCase() : "·";
}

const STATUS_PILL: Record<BridgeRowData["status"], { cls: string; label: string }> = {
  pending: { cls: "pending", label: "Awaiting you" },
  accepted: { cls: "accepted", label: "Accepted" },
  declined: { cls: "declined", label: "Declined" },
};

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

  const pill =
    row.direction === "outgoing" && row.status === "pending"
      ? { cls: "pending", label: "Awaiting them" }
      : STATUS_PILL[row.status];

  return (
    <article className="row">
      {row.other.picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="av av-img" src={row.other.picture} alt="" width={48} height={48} />
      ) : (
        <div className="av">{initial(row.other.name)}</div>
      )}

      <div>
        <div className="who-line">
          <span className="nm">{row.other.name}</span>
        </div>
        {row.other.headline && <div className="ti">{row.other.headline}</div>}
        <div className="swap">
          <div className="gives">
            <span className="key">Note</span>
            {row.note}
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>

      <div className="status">
        <span className={`pill ${pill.cls}`}>{pill.label}</span>
        <span className="since">{formatWhen(row.createdAt)}</span>
      </div>

      <div className="actions">
        {row.direction === "incoming" && row.status === "pending" ? (
          <>
            <button
              type="button"
              className="btn btn-decline"
              onClick={() => void respond("decline")}
              disabled={busy}
            >
              Decline
            </button>
            <button
              type="button"
              className="btn btn-accept"
              onClick={() => void respond("accept")}
              disabled={busy}
            >
              Accept bridge
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}
