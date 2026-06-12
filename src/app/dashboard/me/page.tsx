import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";
import EditMeForm from "./EditMeForm";
import TradesManager, { type MyTrade } from "./TradesManager";
import "./me.css";

export const dynamic = "force-dynamic";

type MeRow = {
  id: number;
  full_name: string;
  professional_title: string | null;
  profile_picture_url: string | null;
  primary_expertise: string;
  current_need: string;
  proof_of_wisdom_url: string;
  is_visible: number;
};

type TradeRow = {
  id: number;
  skill_offered: string;
  skill_needed: string;
  location_preference: string | null;
  pillar: string;
  status: "open" | "matched" | "closed";
  created_at: Date;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((w) => w[0]?.toUpperCase() ?? "").join("");
  return letters || "·";
}

function firstName(name: string): string {
  const first = name.trim().split(/\s+/).filter(Boolean)[0];
  return first || name.trim() || "there";
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export default async function MePage() {
  const session = (await readMemberSession())!;
  const [rowsRaw] = await pool.query(
    `SELECT id, full_name, professional_title, profile_picture_url,
            primary_expertise, current_need, proof_of_wisdom_url, is_visible
       FROM verified_architect_onboarding
      WHERE id = ? LIMIT 1`,
    [session.memberId]
  );
  const me = (rowsRaw as MeRow[])[0];
  if (!me) {
    return <div className="empty-card">Your profile could not be loaded.</div>;
  }

  const [tradeRowsRaw] = await pool.query(
    `SELECT id, skill_offered, skill_needed, location_preference, pillar, status, created_at
       FROM trades
      WHERE member_id = ?
      ORDER BY FIELD(status, 'open', 'matched', 'closed') ASC, created_at DESC`,
    [session.memberId]
  );
  const trades: MyTrade[] = (tradeRowsRaw as TradeRow[]).map((t) => ({
    id: t.id,
    skillOffered: t.skill_offered,
    skillNeeded: t.skill_needed,
    locationPreference: t.location_preference,
    pillar: t.pillar,
    status: t.status,
    createdAt: new Date(t.created_at).toISOString(),
  }));

  // Standing stats derived from real trade data (no invented credit system).
  const openCount = trades.filter((t) => t.status === "open").length;
  const matchedCount = trades.filter((t) => t.status === "matched").length;
  const closedCount = trades.filter((t) => t.status === "closed").length;

  return (
    <div className="ss-me">
      <section className="hero-wrap">
        <div className="hero">
          <div>
            <p className="eyebrow">Your standing</p>
            <h1>
              Welcome back, <em>{firstName(me.full_name)}.</em>
            </h1>
            <p className="lede">
              Your trades and your proof of practice. Edit anything below — changes appear
              to the circle on the Live Bridge.
            </p>
          </div>
          <div className="balance">
            <div className="label">Open trades</div>
            <div>
              <span className="num">{pad2(openCount)}</span>
              <span className="unit">live</span>
            </div>
            <div className="breakdown">
              <div className="stat">
                <div className="n">{pad2(openCount)}</div>
                <div className="d">Open</div>
              </div>
              <div className="stat">
                <div className="n">{pad2(matchedCount)}</div>
                <div className="d">Matched</div>
              </div>
              <div className="stat">
                <div className="n">{pad2(closedCount)}</div>
                <div className="d">Closed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" aria-hidden="true" />

      <div className="body-wrap">
        {/* Left: profile preview + edit */}
        <aside className="profile-card">
          <div className="preview-label">How you appear on the Live Bridge</div>
          <div className="profile-person">
            <div className="profile-av">
              {me.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.profile_picture_url} alt="" width={60} height={60} />
              ) : (
                initials(me.full_name)
              )}
            </div>
            <div>
              <div className="profile-nm">{me.full_name}</div>
              {me.professional_title && <div className="profile-ti">{me.professional_title}</div>}
            </div>
          </div>
          <div className="profile-swap">
            <div className="profile-row gives">
              <span className="k">Gives</span>
              <span className="v">{me.primary_expertise}</span>
            </div>
            <div className="profile-row seeks">
              <span className="k">Seeks</span>
              <span className="v">{me.current_need}</span>
            </div>
          </div>
          <div className="profile-meta">
            <span>{me.is_visible ? "Visible on Bridge" : "Hidden from Bridge"}</span>
            <span>{trades.length === 1 ? "1 trade" : `${trades.length} trades`}</span>
            {me.proof_of_wisdom_url && <span>Proof on file</span>}
          </div>

          <EditMeForm
            initial={{
              primaryExpertise: me.primary_expertise,
              currentNeed: me.current_need,
              proofOfWisdomUrl: me.proof_of_wisdom_url,
            }}
          />
        </aside>

        {/* Right: trades manager */}
        <section className="trades-wrap">
          <div className="trades-head">
            <h2>
              Your <em>active trades</em>
            </h2>
            <span className="ct">{pad2(openCount)} LIVE</span>
          </div>
          <TradesManager trades={trades} />
        </section>
      </div>
    </div>
  );
}
