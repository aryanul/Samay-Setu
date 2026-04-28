import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";
import BridgeRow, { type BridgeRowData } from "./BridgeRow";

export const dynamic = "force-dynamic";

type Row = {
  id: number;
  from_member_id: number;
  to_member_id: number;
  note: string;
  status: "pending" | "accepted" | "declined";
  created_at: Date;
  other_id: number;
  other_name: string;
  other_picture: string | null;
  other_headline: string | null;
};

function toUI(row: Row, direction: "incoming" | "outgoing"): BridgeRowData {
  return {
    id: row.id,
    direction,
    status: row.status,
    note: row.note,
    createdAt: new Date(row.created_at).toISOString(),
    other: {
      id: row.other_id,
      name: row.other_name,
      picture: row.other_picture ?? "",
      headline: row.other_headline ?? "",
    },
  };
}

export default async function BridgesPage() {
  const session = (await readMemberSession())!;

  const [incomingRaw] = await pool.query(
    `SELECT b.id, b.from_member_id, b.to_member_id, b.note, b.status, b.created_at,
            m.id AS other_id, m.full_name AS other_name,
            m.profile_picture_url AS other_picture,
            m.professional_title AS other_headline
       FROM bridges b
       JOIN verified_architect_onboarding m ON m.id = b.from_member_id
      WHERE b.to_member_id = ?
      ORDER BY b.status = 'pending' DESC, b.created_at DESC
      LIMIT 100`,
    [session.memberId]
  );
  const [outgoingRaw] = await pool.query(
    `SELECT b.id, b.from_member_id, b.to_member_id, b.note, b.status, b.created_at,
            m.id AS other_id, m.full_name AS other_name,
            m.profile_picture_url AS other_picture,
            m.professional_title AS other_headline
       FROM bridges b
       JOIN verified_architect_onboarding m ON m.id = b.to_member_id
      WHERE b.from_member_id = ?
        AND b.status = 'pending'
      ORDER BY b.status = 'pending' DESC, b.created_at DESC
      LIMIT 100`,
    [session.memberId]
  );

  const incoming = (incomingRaw as Row[]).map((r) => toUI(r, "incoming"));
  const outgoing = (outgoingRaw as Row[]).map((r) => toUI(r, "outgoing"));

  return (
    <>
      <div className="dash-header">
        <p className="dash-eyebrow">Bridge offers</p>
        <h1 className="dash-title">Who wants to talk, and who you&apos;ve reached for.</h1>
        <p className="dash-subtitle">
          Accepting opens a private chat. Declining is silent — they will not be told.
        </p>
      </div>

      <section className="bridges-section">
        <h2>Incoming</h2>
        <p className="sub">Offers from neighbours who want to bridge with you.</p>
        {incoming.length === 0 ? (
          <div className="empty-card" style={{ padding: 24 }}>
            No incoming offers yet.
          </div>
        ) : (
          incoming.map((row) => <BridgeRow key={row.id} row={row} />)
        )}
      </section>

      <section className="bridges-section">
        <h2>Outgoing</h2>
        <p className="sub">Offers you have sent. They show up here while pending.</p>
        {outgoing.length === 0 ? (
          <div className="empty-card" style={{ padding: 24 }}>
            You haven&apos;t offered any Bridges yet. Open the Live Bridge to start.
          </div>
        ) : (
          outgoing.map((row) => <BridgeRow key={row.id} row={row} />)
        )}
      </section>
    </>
  );
}
