import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";
import EditMeForm from "./EditMeForm";
import TradesManager, { type MyTrade } from "./TradesManager";

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
  status: "open" | "matched" | "closed";
  created_at: Date;
};

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
    `SELECT id, skill_offered, skill_needed, location_preference, status, created_at
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
    status: t.status,
    createdAt: new Date(t.created_at).toISOString(),
  }));

  return (
    <>
      <div className="dash-header">
        <p className="dash-eyebrow">Your card</p>
        <h1 className="dash-title">This is what neighbours see.</h1>
        <p className="dash-subtitle">
          Edit your headline below. List specific trades — what you offer, what you seek — to appear in the Live Bridge feed.
        </p>
      </div>

      <div className="me-card">
        <div className="tc-head">
          {me.profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="tc-avatar" src={me.profile_picture_url} alt="" width={56} height={56} />
          ) : (
            <div className="tc-avatar" aria-hidden="true" />
          )}
          <div>
            <h3 className="tc-name">{me.full_name}</h3>
            {me.professional_title && <p className="tc-headline">{me.professional_title}</p>}
          </div>
        </div>
      </div>

      <div className="me-card">
        <EditMeForm
          initial={{
            primaryExpertise: me.primary_expertise,
            currentNeed: me.current_need,
            proofOfWisdomUrl: me.proof_of_wisdom_url,
          }}
        />
      </div>

      <div className="me-card">
        <h2 className="me-section-title">My trades</h2>
        <p className="me-section-sub">
          Each trade is a specific exchange. Open trades show up in the Live Bridge feed.
        </p>
        <TradesManager trades={trades} />
      </div>
    </>
  );
}
