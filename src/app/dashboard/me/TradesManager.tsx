"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_PILLAR, PILLARS, pillarLabel, type PillarSlug } from "@/lib/pillars";

export type MyTrade = {
  id: number;
  skillOffered: string;
  skillNeeded: string;
  locationPreference: string | null;
  pillar: string;
  status: "open" | "matched" | "closed";
  createdAt: string;
};

const MAX_SKILL = 255;
const MAX_LOCATION = 255;

export default function TradesManager({ trades }: { trades: MyTrade[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [skillOffered, setSkillOffered] = useState("");
  const [skillNeeded, setSkillNeeded] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [pillar, setPillar] = useState<PillarSlug>(DEFAULT_PILLAR);
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
          pillar,
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
      setPillar(DEFAULT_PILLAR);
      setAdding(false);
      router.refresh();
    } catch {
      setError("Network issue. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      {trades.length === 0 ? (
        <p className="trades-empty">No trades yet — list one below to appear in the Live Bridge feed.</p>
      ) : (
        trades.map((t) => <TradeRow key={t.id} trade={t} />)
      )}

      {adding ? (
        <form
          className="trade-create"
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <div className="trade-create-head">
            Add a <em>new trade</em>
          </div>
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
          <div className="trade-create-row">
            <div>
              <label htmlFor="t-pillar">Pillar</label>
              <select
                id="t-pillar"
                className="field"
                value={pillar}
                onChange={(e) => setPillar(e.target.value as PillarSlug)}
              >
                {PILLARS.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
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
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="row">
            <button type="submit" className="tc-bridge-btn" disabled={creating}>
              {creating ? "Adding…" : "Add trade"}
            </button>
            <button
              type="button"
              className="trade-add"
              style={{ margin: 0, width: "auto", padding: "11px 18px" }}
              onClick={() => {
                setAdding(false);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="trade-add" onClick={() => setAdding(true)}>
          + Add a new trade
        </button>
      )}
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

  const meta =
    trade.status === "open" ? (
      <span className="live">● LIVE</span>
    ) : trade.status === "matched" ? (
      <span className="matched">● MATCHED</span>
    ) : (
      <span className="closed">● CLOSED</span>
    );

  return (
    <div className={`trade-item${trade.status === "closed" ? " is-closed" : ""}`}>
      <div>
        <div className="trade-pillar">{pillarLabel(trade.pillar)}</div>
        <div className="trade-swap">
          <span className="gives">{trade.skillOffered}</span>
          <span className="arrow">⇄</span>
          <span className="seeks">{trade.skillNeeded}</span>
        </div>
        <div className="trade-meta">
          {meta}
          {trade.locationPreference && <> &nbsp;·&nbsp; {trade.locationPreference}</>}
        </div>
        {error && <p className="trade-error">{error}</p>}
      </div>
      <div className="trade-actions">
        {trade.status === "open" && (
          <button type="button" className="del" onClick={() => void setStatus("closed")} disabled={busy}>
            Close
          </button>
        )}
        {trade.status === "closed" && (
          <button type="button" onClick={() => void setStatus("open")} disabled={busy}>
            Reopen
          </button>
        )}
      </div>
    </div>
  );
}
