import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";
import { DEFAULT_PILLAR, isPillarSlug, type PillarSlug } from "@/lib/pillars";

export const runtime = "nodejs";

const MAX_SKILL = 255;
const MAX_LOCATION = 255;
const MAX_OPEN_TRADES_PER_MEMBER = 10;

type TradeRow = {
  id: number;
  member_id: number;
  skill_offered: string;
  skill_needed: string;
  location_preference: string | null;
  pillar: string;
  status: "open" | "matched" | "closed";
  created_at: Date;
};

type CountRow = { n: number };

function trimAndCheck(value: unknown, label: string, max: number): string | { error: string } {
  if (typeof value !== "string") return { error: `${label} is required.` };
  const trimmed = value.trim();
  if (!trimmed) return { error: `${label} is required.` };
  if (trimmed.length > max) return { error: `Keep ${label.toLowerCase()} under ${max} characters.` };
  return trimmed;
}

export async function GET() {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  const [rowsRaw] = await pool.query(
    `SELECT id, member_id, skill_offered, skill_needed, location_preference, pillar, status, created_at
       FROM trades
      WHERE member_id = ?
      ORDER BY FIELD(status, 'open', 'matched', 'closed') ASC, created_at DESC`,
    [session.memberId]
  );
  const trades = (rowsRaw as TradeRow[]).map((t) => ({
    id: t.id,
    skillOffered: t.skill_offered,
    skillNeeded: t.skill_needed,
    locationPreference: t.location_preference,
    pillar: t.pillar,
    status: t.status,
    createdAt: new Date(t.created_at).toISOString(),
  }));
  return NextResponse.json({ ok: true, trades });
}

export async function POST(req: NextRequest) {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const skillOffered = trimAndCheck(body.skillOffered, "Skill offered", MAX_SKILL);
  if (typeof skillOffered !== "string") {
    return NextResponse.json({ ok: false, message: skillOffered.error }, { status: 422 });
  }
  const skillNeeded = trimAndCheck(body.skillNeeded, "Skill needed", MAX_SKILL);
  if (typeof skillNeeded !== "string") {
    return NextResponse.json({ ok: false, message: skillNeeded.error }, { status: 422 });
  }

  let locationPreference: string | null = null;
  if (body.locationPreference != null && body.locationPreference !== "") {
    const checked = trimAndCheck(body.locationPreference, "Location", MAX_LOCATION);
    if (typeof checked !== "string") {
      return NextResponse.json({ ok: false, message: checked.error }, { status: 422 });
    }
    locationPreference = checked;
  }

  let pillar: PillarSlug = DEFAULT_PILLAR;
  if (body.pillar != null && body.pillar !== "") {
    if (!isPillarSlug(body.pillar)) {
      return NextResponse.json({ ok: false, message: "Unknown pillar." }, { status: 422 });
    }
    pillar = body.pillar;
  }

  const [countRaw] = await pool.query(
    "SELECT COUNT(*) AS n FROM trades WHERE member_id = ? AND status = 'open'",
    [session.memberId]
  );
  const openCount = (countRaw as CountRow[])[0]?.n ?? 0;
  if (openCount >= MAX_OPEN_TRADES_PER_MEMBER) {
    return NextResponse.json(
      {
        ok: false,
        message: `You already have ${MAX_OPEN_TRADES_PER_MEMBER} open trades. Close one before adding another.`,
      },
      { status: 409 }
    );
  }

  await pool.execute(
    `INSERT INTO trades (member_id, skill_offered, skill_needed, location_preference, pillar, status)
     VALUES (?, ?, ?, ?, ?, 'open')`,
    [session.memberId, skillOffered, skillNeeded, locationPreference, pillar]
  );

  return NextResponse.json({ ok: true });
}
