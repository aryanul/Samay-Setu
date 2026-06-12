"use client";

import { useState } from "react";
import BridgeRow, { type BridgeRowData } from "./BridgeRow";

type TabKey = "incoming" | "outgoing";

export default function BridgesClient({
  incoming,
  outgoing,
}: {
  incoming: BridgeRowData[];
  outgoing: BridgeRowData[];
}) {
  const [tab, setTab] = useState<TabKey>("incoming");

  const groups: Record<TabKey, { label: string; rows: BridgeRowData[]; empty: string }> = {
    incoming: {
      label: "Incoming",
      rows: incoming,
      empty: "No incoming offers yet.",
    },
    outgoing: {
      label: "Outgoing",
      rows: outgoing,
      empty: "You haven't offered any Bridges yet. Open the Live Bridge to start.",
    },
  };

  const active = groups[tab];

  return (
    <>
      <div className="seg-wrap">
        <div className="seg" role="tablist">
          {(Object.keys(groups) as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`seg-tab${tab === key ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              {groups[key].label} <span className="ct">{groups[key].rows.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="list-wrap">
        {active.rows.length === 0 ? (
          <div className="empty-card">{active.empty}</div>
        ) : (
          active.rows.map((row) => <BridgeRow key={row.id} row={row} />)
        )}
      </div>
    </>
  );
}
