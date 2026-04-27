import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";
import TradeCard, { type TradeCardMember } from "./TradeCard";

export const dynamic = "force-dynamic";

type FeedRow = {
  id: number;
  full_name: string;
  professional_title: string | null;
  profile_picture_url: string | null;
  primary_expertise: string;
  current_need: string;
  proof_of_wisdom_url: string;
};

type BridgeStatusRow = {
  to_member_id: number;
  status: "pending" | "accepted" | "declined";
};

export default async function DashboardFeedPage() {
  const session = (await readMemberSession())!;

  const [rowsRaw] = await pool.query(
    `SELECT id, full_name, professional_title, profile_picture_url,
            primary_expertise, current_need, proof_of_wisdom_url
       FROM verified_architect_onboarding
      WHERE is_visible = 1 AND id <> ?
      ORDER BY created_at DESC`,
    [session.memberId]
  );
  const members = rowsRaw as FeedRow[];

  const [bridgeRowsRaw] = await pool.query(
    `SELECT to_member_id, status
       FROM bridges
      WHERE from_member_id = ?
        AND status IN ('pending', 'accepted')`,
    [session.memberId]
  );
  const bridgeRows = bridgeRowsRaw as BridgeStatusRow[];
  const statusByTarget = new Map<number, "pending" | "accepted">();
  for (const row of bridgeRows) {
    if (row.status === "pending" || row.status === "accepted") {
      statusByTarget.set(row.to_member_id, row.status);
    }
  }

  const cards: TradeCardMember[] = members.map((m) => ({
    id: m.id,
    name: m.full_name,
    headline: m.professional_title ?? "",
    picture: m.profile_picture_url ?? "",
    give: m.primary_expertise,
    take: m.current_need,
    proofUrl: m.proof_of_wisdom_url,
    existingBridgeStatus: statusByTarget.get(m.id) ?? null,
  }));

  return (
    <>
      <div className="dash-header">
        <p className="dash-eyebrow">The Live Bridge</p>
        <h1 className="dash-title">A circle of trade, not transaction.</h1>
        <p className="dash-subtitle">
          Each card is one verified neighbour. Read what they give, what they seek,
          and offer a Bridge if there&apos;s an exchange to be made. Phones and emails
          stay private — the first conversation happens here.
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="empty-card">
          No other members yet. The circle is just opening — check back soon.
        </div>
      ) : (
        <div className="feed-grid">
          {cards.map((m) => (
            <TradeCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </>
  );
}
