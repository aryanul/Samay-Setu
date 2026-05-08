"use client";

import Link from "next/link";
import { useState } from "react";
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
  proofUrl: string;
  bridge: BridgeState | null;
};

export default function TradeCard({ member }: { member: TradeCardMember }) {
  const [open, setOpen] = useState(false);
  const [bridge, setBridge] = useState<BridgeState | null>(member.bridge);

  return (
    <article className="trade-card">
      <div className="tc-head">
        {member.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="tc-avatar" src={member.picture} alt="" width={56} height={56} />
        ) : (
          <div className="tc-avatar" aria-hidden="true" />
        )}
        <div>
          <h3 className="tc-name">{member.name}</h3>
          {member.headline && <p className="tc-headline">{member.headline}</p>}
        </div>
      </div>

      <div className="tc-pillar">
        <p className="tc-pillar-tag">Gives</p>
        <p className="tc-pillar-body">{member.give}</p>
      </div>
      <div className="tc-pillar">
        <p className="tc-pillar-tag">Seeks</p>
        <p className="tc-pillar-body">{member.take}</p>
      </div>
      {member.location && (
        <div className="tc-pillar">
          <p className="tc-pillar-tag">Where</p>
          <p className="tc-pillar-body">{member.location}</p>
        </div>
      )}

      <div className="tc-foot">
        <a className="tc-proof" href={member.proofUrl} target="_blank" rel="noreferrer noopener">
          View proof of practice ↗
        </a>
        {bridge?.status === "accepted" ? (
          bridge.threadId ? (
            <Link className="tc-bridge-btn" href={`/dashboard/chat/${bridge.threadId}`}>
              Open chat
            </Link>
          ) : (
            <span className="tc-status-pill">Bridge open</span>
          )
        ) : bridge?.status === "pending" && bridge.direction === "outgoing" ? (
          <span className="tc-status-pill">Awaiting response</span>
        ) : bridge?.status === "pending" && bridge.direction === "incoming" ? (
          <Link className="tc-bridge-btn" href="/dashboard/bridges">
            Respond to their offer
          </Link>
        ) : (
          <button type="button" className="tc-bridge-btn" onClick={() => setOpen(true)}>
            Offer a Bridge
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
