/**
 * The Founding 50 Race — referral leaderboard contest.
 *
 * A member shares their stable invite link (/r/<code>). When a NEW practitioner
 * arrives through it and completes Verified Architect onboarding, a verified
 * referral is recorded (see src/lib/referral.ts + api/onboarding/architect).
 * Rank is the live ordering of members by verified-referral count.
 */
import { pool } from "@/lib/db";
import { getAppBaseUrl } from "@/lib/linkedin-oauth";

/** Editable contest configuration. Override the deadline via CONTEST_DEADLINE. */
export const CONTEST = {
  title: "The Founding 50 Race",
  eyebrow: "The Wisdom Unlock",
  tagline: "Five seats. One week.",
  /** ISO 8601 with offset. Defaults to the upcoming Friday 23:59 IST. */
  deadlineIso: process.env.CONTEST_DEADLINE?.trim() || "2026-06-19T23:59:00+05:30",
  winners: 5,
  prize: {
    title: "The Lifetime VIP Pass",
    sub: "Awarded to the top 5 by Friday 23:59 IST",
    perks: [
      'Permanent "Legendary Architect" badge on your dashboard',
      "6 months matching priority — first pick on every new high-value trade",
      "Quarterly 1:1 with the founder & top-tier VC introductions",
    ],
  },
} as const;

/** How many leaderboard rows we ship to the client. */
const LEADERBOARD_LIMIT = 50;

export type LeaderRow = {
  memberId: number;
  rank: number;
  name: string;
  title: string | null;
  picture: string | null;
  refs: number;
  today: number;
  isYou: boolean;
};

export type ContestSnapshot = {
  config: {
    title: string;
    eyebrow: string;
    tagline: string;
    deadlineIso: string;
    winners: number;
    prize: { title: string; sub: string; perks: readonly string[] };
  };
  totalRacers: number;
  you: {
    memberId: number;
    inRace: boolean;
    rank: number | null;
    refs: number;
    today: number;
    code: string;
    inviteUrl: string;
    /** Verified referrals still needed to break into the top `winners`. */
    refsToTop: number | null;
  };
  leaderboard: LeaderRow[];
};

function slugifyName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 16);
}

/** The public invite URL for a referral code. */
export function referralUrlFor(code: string): string {
  return `${getAppBaseUrl()}/r/${code}`;
}

type CodeRow = { code: string };
type NameRow = { full_name: string };

/** Returns the member's stable referral code, creating it on first request. */
export async function getOrCreateReferralCode(memberId: number): Promise<string> {
  const [existingRaw] = await pool.query(
    "SELECT code FROM referral_codes WHERE member_id = ? LIMIT 1",
    [memberId]
  );
  const existing = (existingRaw as CodeRow[])[0];
  if (existing) return existing.code;

  const [nameRaw] = await pool.query(
    "SELECT full_name FROM verified_architect_onboarding WHERE id = ? LIMIT 1",
    [memberId]
  );
  const fullName = (nameRaw as NameRow[])[0]?.full_name ?? "";
  const base = slugifyName(fullName) || "architect";
  // memberId in base36 makes the code unique without retries.
  const code = `${base}-${memberId.toString(36)}`;

  try {
    await pool.execute(
      "INSERT INTO referral_codes (member_id, code) VALUES (?, ?)",
      [memberId, code]
    );
    return code;
  } catch {
    // Concurrent insert for the same member — re-read the winner.
    const [againRaw] = await pool.query(
      "SELECT code FROM referral_codes WHERE member_id = ? LIMIT 1",
      [memberId]
    );
    const again = (againRaw as CodeRow[])[0];
    if (again) return again.code;
    throw new Error("Could not allocate referral code");
  }
}

type ReferrerRow = { member_id: number };

/**
 * Attribute a freshly-onboarded member to the owner of `code`. No-ops on an
 * unknown code, a self-referral, or a duplicate (referee already attributed).
 */
export async function recordReferralFromCode(
  code: string,
  refereeMemberId: number
): Promise<void> {
  const [rowsRaw] = await pool.query(
    "SELECT member_id FROM referral_codes WHERE code = ? LIMIT 1",
    [code]
  );
  const referrerId = (rowsRaw as ReferrerRow[])[0]?.member_id;
  if (!referrerId || Number(referrerId) === Number(refereeMemberId)) return;

  await pool.execute(
    "INSERT IGNORE INTO referrals (referrer_member_id, referee_member_id, code) VALUES (?, ?, ?)",
    [referrerId, refereeMemberId, code]
  );
}

type RaceRow = {
  id: number;
  full_name: string;
  professional_title: string | null;
  profile_picture_url: string | null;
  refs: number;
  today: number;
};

/**
 * Builds the full contest snapshot from the viewer's perspective: the ranked
 * leaderboard, total racers, and the viewer's own standing + invite link.
 */
export async function getContestSnapshot(viewerMemberId: number): Promise<ContestSnapshot> {
  const code = await getOrCreateReferralCode(viewerMemberId);

  const [rowsRaw] = await pool.query(
    `SELECT m.id,
            m.full_name,
            m.professional_title,
            m.profile_picture_url,
            COUNT(r.id) AS refs,
            COALESCE(SUM(r.created_at >= UTC_DATE()), 0) AS today
       FROM verified_architect_onboarding m
       LEFT JOIN referrals r ON r.referrer_member_id = m.id
      GROUP BY m.id, m.full_name, m.professional_title, m.profile_picture_url
      ORDER BY refs DESC, m.id ASC`
  );
  const rows = (rowsRaw as RaceRow[]).map((r) => ({
    ...r,
    refs: Number(r.refs),
    today: Number(r.today),
  }));

  // Only members with at least one verified referral are "in the race".
  const racers = rows.filter((r) => r.refs > 0);
  const totalRacers = racers.length;
  const fifthRefs = racers[CONTEST.winners - 1]?.refs ?? null;

  const leaderboard: LeaderRow[] = racers.slice(0, LEADERBOARD_LIMIT).map((r, i) => ({
    memberId: r.id,
    rank: i + 1,
    name: r.full_name,
    title: r.professional_title,
    picture: r.profile_picture_url,
    refs: r.refs,
    today: r.today,
    isYou: r.id === viewerMemberId,
  }));

  const youIndex = racers.findIndex((r) => r.id === viewerMemberId);
  const youRow = youIndex >= 0 ? racers[youIndex] : null;
  const youRank = youIndex >= 0 ? youIndex + 1 : null;

  let refsToTop: number | null = null;
  if (youRank !== null) {
    if (youRank <= CONTEST.winners) {
      refsToTop = 0;
    } else if (fifthRefs !== null && youRow) {
      refsToTop = Math.max(1, fifthRefs - youRow.refs + 1);
    }
  }

  return {
    config: {
      title: CONTEST.title,
      eyebrow: CONTEST.eyebrow,
      tagline: CONTEST.tagline,
      deadlineIso: CONTEST.deadlineIso,
      winners: CONTEST.winners,
      prize: CONTEST.prize,
    },
    totalRacers,
    you: {
      memberId: viewerMemberId,
      inRace: youRank !== null,
      rank: youRank,
      refs: youRow?.refs ?? 0,
      today: youRow?.today ?? 0,
      code,
      inviteUrl: referralUrlFor(code),
      refsToTop,
    },
    leaderboard,
  };
}
