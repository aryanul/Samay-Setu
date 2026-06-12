import Link from "next/link";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";
import { isPillarSlug, pillarLabel, type PillarSlug } from "@/lib/pillars";
import { CONTEST } from "@/lib/contest";
import TrophyIcon from "@/components/TrophyIcon";
import LiveBridgeFilters from "./LiveBridgeFilters";
import TradeCard, { type TradeCardMember } from "./TradeCard";
import "./page.css";

export const dynamic = "force-dynamic";

type FeedRow = {
  trade_id: number;
  skill_offered: string;
  skill_needed: string;
  location_preference: string | null;
  pillar: string;
  member_id: number;
  full_name: string;
  professional_title: string | null;
  profile_picture_url: string | null;
  proof_of_wisdom_url: string;
};

type MyTradeRow = {
  id: number;
  skill_offered: string;
  skill_needed: string;
};

function normSkill(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

type BridgeStatusRow = {
  other_id: number;
  status: "pending" | "accepted";
  direction: "outgoing" | "incoming";
  thread_id: number | null;
};

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string): string | null {
  const raw = params[key];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

export default async function DashboardFeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = (await readMemberSession())!;
  const params = await searchParams;

  const pillarParam = readParam(params, "pillar");
  const activePillar: PillarSlug | null = isPillarSlug(pillarParam) ? pillarParam : null;
  const rawQuery = (readParam(params, "q") ?? "").trim();
  const query = rawQuery.slice(0, 80);

  const filters: string[] = ["t.status = 'open'", "m.is_visible = 1", "m.id <> ?"];
  const queryArgs: (string | number)[] = [session.memberId];

  if (activePillar) {
    filters.push("t.pillar = ?");
    queryArgs.push(activePillar);
  }
  if (query) {
    filters.push("(t.skill_offered LIKE ? OR t.skill_needed LIKE ? OR t.location_preference LIKE ?)");
    const like = `%${query}%`;
    queryArgs.push(like, like, like);
  }

  const whereSql = filters.join(" AND ");

  const [rowsRaw] = await pool.query(
    `SELECT t.id           AS trade_id,
            t.skill_offered,
            t.skill_needed,
            t.location_preference,
            t.pillar,
            m.id           AS member_id,
            m.full_name,
            m.professional_title,
            m.profile_picture_url,
            m.proof_of_wisdom_url
       FROM trades t
       JOIN verified_architect_onboarding m ON m.id = t.member_id
      WHERE ${whereSql}
      ORDER BY t.created_at DESC`,
    queryArgs
  );
  const trades = rowsRaw as FeedRow[];

  const [myTradesRaw] = await pool.query(
    `SELECT id, skill_offered, skill_needed
       FROM trades
      WHERE member_id = ?
        AND status = 'open'`,
    [session.memberId]
  );
  const myTrades = myTradesRaw as MyTradeRow[];

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

  const cards: TradeCardMember[] = trades.map((t) => {
    const theirGive = normSkill(t.skill_offered);
    const theirSeek = normSkill(t.skill_needed);
    const matchedMine = myTrades.find(
      (mine) =>
        normSkill(mine.skill_offered) === theirSeek &&
        normSkill(mine.skill_needed) === theirGive
    );
    return {
      tradeId: t.trade_id,
      id: t.member_id,
      name: t.full_name,
      headline: t.professional_title ?? "",
      picture: t.profile_picture_url ?? "",
      give: t.skill_offered,
      take: t.skill_needed,
      location: t.location_preference,
      pillar: t.pillar,
      proofUrl: t.proof_of_wisdom_url,
      bridge: stateByTarget.get(t.member_id) ?? null,
      match: matchedMine ? { myTradeId: matchedMine.id } : null,
    };
  });

  // Surface mutual matches first.
  cards.sort((a, b) => {
    const am = a.match ? 1 : 0;
    const bm = b.match ? 1 : 0;
    return bm - am;
  });

  const scopeLabel = activePillar ? pillarLabel(activePillar) : "all pillars";
  const openCount = String(cards.length).padStart(2, "0");

  return (
    <div className="ss-feed">
      {/* Founding 50 Race promo banner */}
      <Link className="cb-banner" href="/dashboard/contest">
        <div className="cb-banner-inner">
          <div className="cb-banner-motif" aria-hidden="true" />
          <div className="cb-banner-icon" aria-hidden="true"><TrophyIcon /></div>
          <div className="cb-banner-body">
            <div className="cb-banner-title">
              <em>{CONTEST.title}</em> is live — {CONTEST.winners} Lifetime VIP Passes up for grabs.
            </div>
            <div className="cb-banner-sub">
              Top {CONTEST.winners} referrers by Friday 23:59 IST win.{" "}
              <span className="mono">Climb the leaderboard with verified referrals.</span>
            </div>
          </div>
          <span className="cb-banner-cta">View race →</span>
        </div>
      </Link>

      <section className="cb-hero">
        <div className="cb-hero-inner">
          <p className="cb-eyebrow">
            The Live Bridge <span className="vol">{scopeLabel}</span>
          </p>
          <h1 className="cb-h1">
            Who, this week,
            <br />
            <em>has time to give.</em>
          </h1>
          <p className="cb-lede">
            Each card is a verified neighbour, the hour they offer, and the hour they seek.
            Mutual matches surface first. Read carefully — the swap begins with attention.
          </p>
        </div>
      </section>

      <div className="cb-divider" aria-hidden="true" />

      <LiveBridgeFilters activePillar={activePillar} initialQuery={query} />

      <div className="cb-count">
        <span>
          <strong>{openCount}</strong> open trades · across <em>{scopeLabel}</em>
        </span>
        <span>North Kolkata · this fortnight</span>
      </div>

      {cards.length === 0 ? (
        <div className="cb-empty">
          <div className="cb-empty-inner">
            {query || activePillar
              ? "No trades match this filter yet. Try widening it."
              : "No open trades right now. The circle is just opening — check back soon."}
          </div>
        </div>
      ) : (
        <div className="cb-grid">
          {cards.map((m) => (
            <TradeCard key={m.tradeId} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}
