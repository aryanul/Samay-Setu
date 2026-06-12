"use client";

import Link from "next/link";
import { useState } from "react";
import { pillarLabel } from "@/lib/pillars";
import OfferBridgeModal from "./OfferBridgeModal";

export type BridgeState = {
  status: "pending" | "accepted";
  direction: "outgoing" | "incoming";
  threadId: number | null;
};

export type TradeCardMember = {
  tradeId: number;
  id: number;
  name: string;
  headline: string;
  picture: string;
  give: string;
  take: string;
  location: string | null;
  pillar: string;
  proofUrl: string;
  bridge: BridgeState | null;
  match: { myTradeId: number } | null;
};

function tradeRef(tradeId: number): string {
  return `№ ${String(tradeId).padStart(4, "0")}`;
}

function initial(name: string): string {
  const c = name.trim()[0];
  return c ? c.toUpperCase() : "·";
}

export default function TradeCard({ member }: { member: TradeCardMember }) {
  const [open, setOpen] = useState(false);
  const [bridge, setBridge] = useState<BridgeState | null>(member.bridge);

  const isMatch = !!member.match;

  return (
    <article className={`cb-card${isMatch ? " match" : ""}`}>
      <div className="cb-card-head">
        <span className="cb-pillar">{pillarLabel(member.pillar)}</span>
        <span className="cb-card-id">{tradeRef(member.tradeId)}</span>
      </div>

      <div className="cb-person">
        {member.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cb-avatar" src={member.picture} alt="" width={52} height={52} />
        ) : (
          <div className="cb-avatar" aria-hidden="true">
            {initial(member.name)}
          </div>
        )}
        <div>
          <div className="nm">{member.name}</div>
          {member.headline && <div className="ti">{member.headline}</div>}
        </div>
      </div>

      <div className="cb-swap">
        <div className="cb-row gives">
          <span className="k">Gives</span>
          <span className="v">{member.give}</span>
        </div>
        <div className="cb-row seeks">
          <span className="k">Seeks</span>
          <span className="v">{member.take}</span>
        </div>
      </div>

      <div className="cb-meta">
        <span>1 hr</span>
        {member.location && <span>{member.location}</span>}
      </div>

      <div className="cb-actions">
        <a className="cb-proof" href={member.proofUrl} target="_blank" rel="noreferrer noopener">
          View proof of practice ↗
        </a>

        {bridge?.status === "accepted" ? (
          bridge.threadId ? (
            <Link className="cb-cta" href={`/dashboard/chat/${bridge.threadId}`}>
              Open chat
            </Link>
          ) : (
            <span className="cb-status">Bridge open</span>
          )
        ) : bridge?.status === "pending" && bridge.direction === "outgoing" ? (
          <span className="cb-status">Awaiting response</span>
        ) : bridge?.status === "pending" && bridge.direction === "incoming" ? (
          <Link className="cb-cta" href="/dashboard/bridges">
            Respond
          </Link>
        ) : (
          <button type="button" className="cb-cta" onClick={() => setOpen(true)}>
            Offer Bridge
          </button>
        )}
      </div>

      {open && (
        <OfferBridgeModal
          recipientName={member.name}
          toMemberId={member.id}
          onClose={() => setOpen(false)}
          onSent={() => {
            setBridge({ status: "pending", direction: "outgoing", threadId: null });
            setOpen(false);
          }}
        />
      )}
    </article>
  );
}
