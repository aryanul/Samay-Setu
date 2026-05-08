import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";
import TradeCard, { type TradeCardMember } from "./TradeCard";

export const dynamic = "force-dynamic";

type FeedRow = {
  trade_id: number;
  skill_offered: string;
  skill_needed: string;
  location_preference: string | null;
  member_id: number;
  full_name: string;
  professional_title: string | null;
  profile_picture_url: string | null;
  proof_of_wisdom_url: string;
};

type BridgeStatusRow = {
  other_id: number;
  status: "pending" | "accepted";
  direction: "outgoing" | "incoming";
  thread_id: number | null;
};

export default async function DashboardFeedPage() {
  const session = (await readMemberSession())!;

  const [rowsRaw] = await pool.query(
    `SELECT t.id           AS trade_id,
            t.skill_offered,
            t.skill_needed,
            t.location_preference,
            m.id           AS member_id,
            m.full_name,
            m.professional_title,
            m.profile_picture_url,
            m.proof_of_wisdom_url
       FROM trades t
       JOIN verified_architect_onboarding m ON m.id = t.member_id
      WHERE t.status = 'open'
        AND m.is_visible = 1
        AND m.id <> ?
      ORDER BY t.created_at DESC`,
    [session.memberId]
  );
  const trades = rowsRaw as FeedRow[];

  const [bridgeRowsRaw] = await pool.query(
    `SELECT
        CASE WHEN b.from_member_id = ? THEN b.to_member_id ELSE b.from_member_id END AS other_id,
        b.status,
        CASE WHEN b.from_member_id = ? THEN 'outgoing' ELSE 'incoming' END AS direction,
        t.id AS thread_id
       FROM bridges b
       LEFT JOIN chat_threads t
         ON t.member_a_id = LEAST(b.from_member_id, b.to_member_id)
        AND t.member_b_id = GREATEST(b.from_member_id, b.to_member_id)
      WHERE b.status IN ('pending', 'accepted')
        AND (b.from_member_id = ? OR b.to_member_id = ?)`,
    [session.memberId, session.memberId, session.memberId, session.memberId]
  );
  const bridgeRows = bridgeRowsRaw as BridgeStatusRow[];
  const stateByTarget = new Map<number, TradeCardMember["bridge"]>();
  for (const row of bridgeRows) {
    const existing = stateByTarget.get(row.other_id);
    if (existing && existing.status === "accepted") continue;
    stateByTarget.set(row.other_id, {
      status: row.status,
      direction: row.direction,
      threadId: row.thread_id ?? null,
    });
  }

  const cards: TradeCardMember[] = trades.map((t) => ({
    tradeId: t.trade_id,
    id: t.member_id,
    name: t.full_name,
    headline: t.professional_title ?? "",
    picture: t.profile_picture_url ?? "",
    give: t.skill_offered,
    take: t.skill_needed,
    location: t.location_preference,
    proofUrl: t.proof_of_wisdom_url,
    bridge: stateByTarget.get(t.member_id) ?? null,
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
          No open trades right now. The circle is just opening — check back soon.
        </div>
      ) : (
        <div className="feed-grid">
          {cards.map((m) => (
            <TradeCard key={m.tradeId} member={m} />
          ))}
        </div>
      )}
    </>
  );
}
