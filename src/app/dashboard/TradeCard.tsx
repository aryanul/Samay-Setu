"use client";

import { useState } from "react";
import OfferBridgeModal from "./OfferBridgeModal";

export type TradeCardMember = {
  id: number;
  name: string;
  headline: string;
  picture: string;
  give: string;
  take: string;
  proofUrl: string;
  existingBridgeStatus: "pending" | "accepted" | null;
};

export default function TradeCard({ member }: { member: TradeCardMember }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"pending" | "accepted" | null>(member.existingBridgeStatus);

  const buttonLabel =
    status === "accepted" ? "Bridge open" : status === "pending" ? "Awaiting response" : "Offer a Bridge";

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

      <div className="tc-foot">
        <a className="tc-proof" href={member.proofUrl} target="_blank" rel="noreferrer noopener">
          View proof of practice ↗
        </a>
        {status ? (
          <span className="tc-status-pill">{buttonLabel}</span>
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
            setStatus("pending");
            setOpen(false);
          }}
        />
      )}
    </article>
  );
}
