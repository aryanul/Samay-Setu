import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";

export const runtime = "nodejs";

const MAX_NOTE = 280;

type ListRow = {
  id: number;
  from_member_id: number;
  to_member_id: number;
  note: string;
  status: "pending" | "accepted" | "declined";
  created_at: Date;
  responded_at: Date | null;
  other_id: number;
  other_name: string;
  other_picture: string | null;
  other_headline: string | null;
};

export async function GET() {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  const [incomingRaw] = await pool.query(
    `SELECT b.id, b.from_member_id, b.to_member_id, b.note, b.status,
            b.created_at, b.responded_at,
            m.id AS other_id, m.full_name AS other_name,
            m.profile_picture_url AS other_picture,
            m.professional_title AS other_headline
       FROM bridges b
       JOIN verified_architect_onboarding m ON m.id = b.from_member_id
      WHERE b.to_member_id = ?
      ORDER BY b.created_at DESC
      LIMIT 100`,
    [session.memberId]
  );
  const [outgoingRaw] = await pool.query(
    `SELECT b.id, b.from_member_id, b.to_member_id, b.note, b.status,
            b.created_at, b.responded_at,
            m.id AS other_id, m.full_name AS other_name,
            m.profile_picture_url AS other_picture,
            m.professional_title AS other_headline
       FROM bridges b
       JOIN verified_architect_onboarding m ON m.id = b.to_member_id
      WHERE b.from_member_id = ?
      ORDER BY b.created_at DESC
      LIMIT 100`,
    [session.memberId]
  );

  return NextResponse.json({
    ok: true,
    incoming: incomingRaw as ListRow[],
    outgoing: outgoingRaw as ListRow[],
  });
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

  const toMemberId = Number(body.toMemberId);
  const note = String(body.note ?? "").trim();

  if (!Number.isInteger(toMemberId) || toMemberId <= 0) {
    return NextResponse.json({ ok: false, message: "Missing target member." }, { status: 422 });
  }
  if (toMemberId === session.memberId) {
    return NextResponse.json({ ok: false, message: "You cannot offer a Bridge to yourself." }, { status: 422 });
  }
  if (note.length < 6) {
    return NextResponse.json({ ok: false, message: "Add a one-line note (at least a few words)." }, { status: 422 });
  }
  if (note.length > MAX_NOTE) {
    return NextResponse.json({ ok: false, message: `Keep notes under ${MAX_NOTE} characters.` }, { status: 422 });
  }

  const [targetRowsRaw] = await pool.query(
    "SELECT id FROM verified_architect_onboarding WHERE id = ? AND is_visible = 1 LIMIT 1",
    [toMemberId]
  );
  if ((targetRowsRaw as unknown[]).length === 0) {
    return NextResponse.json({ ok: false, message: "That member is no longer visible." }, { status: 404 });
  }

  const [openRowsRaw] = await pool.query(
    `SELECT id FROM bridges
      WHERE from_member_id = ? AND to_member_id = ? AND status = 'pending'
      LIMIT 1`,
    [session.memberId, toMemberId]
  );
  if ((openRowsRaw as unknown[]).length > 0) {
    return NextResponse.json(
      { ok: false, message: "You already have an open offer waiting on them." },
      { status: 409 }
    );
  }

  try {
    await pool.execute(
      "INSERT INTO bridges (from_member_id, to_member_id, note) VALUES (?, ?, ?)",
      [session.memberId, toMemberId, note]
    );
  } catch (err) {
    console.error("[bridges/POST] insert failed:", err);
    return NextResponse.json(
      { ok: false, message: "Could not send your offer right now." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
