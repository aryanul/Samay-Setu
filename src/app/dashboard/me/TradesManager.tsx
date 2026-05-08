"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type MyTrade = {
  id: number;
  skillOffered: string;
  skillNeeded: string;
  locationPreference: string | null;
  status: "open" | "matched" | "closed";
  createdAt: string;
};

const MAX_SKILL = 255;
const MAX_LOCATION = 255;

export default function TradesManager({ trades }: { trades: MyTrade[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [skillOffered, setSkillOffered] = useState("");
  const [skillNeeded, setSkillNeeded] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [error, setError] = useState("");

  async function create() {
    if (!skillOffered.trim() || !skillNeeded.trim()) {
      setError("Both Offered and Needed are required.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillOffered: skillOffered.trim(),
          skillNeeded: skillNeeded.trim(),
          locationPreference: locationPreference.trim() || null,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        setError(result?.message || "Could not create trade.");
        return;
      }
      setSkillOffered("");
      setSkillNeeded("");
      setLocationPreference("");
      router.refresh();
    } catch {
      setError("Network issue. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="trades-list">
        {trades.length === 0 ? (
          <p className="trades-empty">No trades yet — list one below to appear in the Live Bridge feed.</p>
        ) : (
          trades.map((t) => <TradeRow key={t.id} trade={t} />)
        )}
      </div>

      <form
        className="trade-create"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <div className="trade-create-row">
          <div>
            <label htmlFor="t-offered">I can offer</label>
            <input
              id="t-offered"
              className="field"
              type="text"
              maxLength={MAX_SKILL}
              value={skillOffered}
              onChange={(e) => setSkillOffered(e.target.value)}
              placeholder="e.g. SEO audit, dog walking, Bengali tutoring"
            />
          </div>
          <div>
            <label htmlFor="t-needed">In exchange for</label>
            <input
              id="t-needed"
              className="field"
              type="text"
              maxLength={MAX_SKILL}
              value={skillNeeded}
              onChange={(e) => setSkillNeeded(e.target.value)}
              placeholder="e.g. home cooking, guitar lessons"
            />
          </div>
        </div>
        <label htmlFor="t-loc">Location preference (optional)</label>
        <input
          id="t-loc"
          className="field"
          type="text"
          maxLength={MAX_LOCATION}
          value={locationPreference}
          onChange={(e) => setLocationPreference(e.target.value)}
          placeholder="e.g. North Kolkata, Remote, Salt Lake"
        />

        {error && <p className="form-error">{error}</p>}

        <div className="row">
          <button type="submit" className="tc-bridge-btn" disabled={creating}>
            {creating ? "Adding…" : "Add trade"}
          </button>
        </div>
      </form>
    </>
  );
}

function TradeRow({ trade }: { trade: MyTrade }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setStatus(status: "open" | "closed") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        setError(result?.message || "Could not update.");
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
    <div className="trade-row">
      <div className="trade-body">
        <div className="trade-pillars">
          <span className="trade-pillar-tag">Gives</span>
          <span className="trade-pillar-body">{trade.skillOffered}</span>
        </div>
        <div className="trade-pillars">
          <span className="trade-pillar-tag">Seeks</span>
          <span className="trade-pillar-body">{trade.skillNeeded}</span>
        </div>
        {trade.locationPreference && (
          <div className="trade-pillars">
            <span className="trade-pillar-tag">Where</span>
            <span className="trade-pillar-body">{trade.locationPreference}</span>
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
      </div>
      <div className="trade-actions">
        <span className={`status-tag ${trade.status}`}>{trade.status}</span>
        {trade.status === "open" && (
          <button
            type="button"
            className="btn-decline"
            onClick={() => void setStatus("closed")}
            disabled={busy}
          >
            Close
          </button>
        )}
        {trade.status === "closed" && (
          <button
            type="button"
            className="btn-accept"
            onClick={() => void setStatus("open")}
            disabled={busy}
          >
            Reopen
          </button>
        )}
      </div>
    </div>
  );
}
