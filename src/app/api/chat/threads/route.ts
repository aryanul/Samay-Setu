import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";

export const runtime = "nodejs";

type ThreadRow = {
  id: number;
  member_a_id: number;
  member_b_id: number;
  last_message_at: Date | null;
  created_at: Date;
  other_id: number;
  other_name: string;
  other_picture: string | null;
  other_headline: string | null;
  last_body: string | null;
  last_at: Date | null;
};

export async function GET() {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  const [rowsRaw] = await pool.query(
    `SELECT t.id, t.member_a_id, t.member_b_id, t.last_message_at, t.created_at,
            m.id   AS other_id,
            m.full_name AS other_name,
            m.profile_picture_url AS other_picture,
            m.professional_title  AS other_headline,
            (SELECT body       FROM chat_messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_body,
            (SELECT created_at FROM chat_messages WHERE thread_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_at
       FROM chat_threads t
       JOIN verified_architect_onboarding m
         ON m.id = IF(t.member_a_id = ?, t.member_b_id, t.member_a_id)
      WHERE t.member_a_id = ? OR t.member_b_id = ?
      ORDER BY COALESCE(t.last_message_at, t.created_at) DESC
      LIMIT 100`,
    [session.memberId, session.memberId, session.memberId]
  );

  const threads = (rowsRaw as ThreadRow[]).map((r) => ({
    id: r.id,
    other: {
      id: r.other_id,
      name: r.other_name,
      picture: r.other_picture ?? "",
      headline: r.other_headline ?? "",
    },
    lastBody: r.last_body ?? "",
    lastAt: r.last_at ? new Date(r.last_at).toISOString() : null,
    createdAt: new Date(r.created_at).toISOString(),
  }));

  return NextResponse.json({ ok: true, threads });
}
