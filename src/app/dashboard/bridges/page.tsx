import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";
import { type BridgeRowData } from "./BridgeRow";
import BridgesClient from "./BridgesClient";
import "./bridges.css";

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
  const session = await readMemberSession();
  if (!session) redirect("/login");

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
    <div className="ss-bridges">
      <section className="hero-wrap">
        <div className="hero">
          <p className="eyebrow">
            Your bridges <span className="vol">Inbox</span>
          </p>
          <h1>
            Who wants to talk,
            <br />
            <em>and who you&apos;ve reached for.</em>
          </h1>
          <p className="lede">
            A bridge is a one-tap &ldquo;yes, let&apos;s do this swap.&rdquo; Accept to open the chat.
            Decline cleanly — they will not be told.
          </p>
        </div>
      </section>

      <div className="divider" aria-hidden="true" />

      <BridgesClient incoming={incoming} outgoing={outgoing} />
    </div>
  );
}
