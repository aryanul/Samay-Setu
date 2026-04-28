import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";

export const runtime = "nodejs";

const MAX_BODY = 2000;
const PAGE_LIMIT = 200;

type ThreadRow = {
  id: number;
  member_a_id: number;
  member_b_id: number;
};

type MessageRow = {
  id: number;
  thread_id: number;
  from_member_id: number;
  body: string;
  created_at: Date;
};

async function loadThread(threadId: number, memberId: number): Promise<ThreadRow | null> {
  const [rowsRaw] = await pool.query(
    "SELECT id, member_a_id, member_b_id FROM chat_threads WHERE id = ? LIMIT 1",
    [threadId]
  );
  const rows = rowsRaw as ThreadRow[];
  const t = rows[0];
  if (!t) return null;
  if (t.member_a_id !== memberId && t.member_b_id !== memberId) return null;
  return t;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ threadId: string }> }) {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }
  const { threadId: rawId } = await ctx.params;
  const threadId = Number(rawId);
  if (!Number.isInteger(threadId) || threadId <= 0) {
    return NextResponse.json({ ok: false, message: "Invalid thread id." }, { status: 400 });
  }

  const thread = await loadThread(threadId, session.memberId);
  if (!thread) {
    return NextResponse.json({ ok: false, message: "Thread not found." }, { status: 404 });
  }

  const sinceIdRaw = req.nextUrl.searchParams.get("sinceId");
  let rowsRaw;
  if (sinceIdRaw !== null) {
    const sinceId = Number(sinceIdRaw);
    if (!Number.isInteger(sinceId) || sinceId < 0) {
      return NextResponse.json({ ok: false, message: "Invalid 'sinceId' value." }, { status: 400 });
    }
    [rowsRaw] = await pool.query(
      `SELECT id, thread_id, from_member_id, body, created_at
         FROM chat_messages
        WHERE thread_id = ? AND id > ?
        ORDER BY id ASC
        LIMIT ?`,
      [threadId, sinceId, PAGE_LIMIT]
    );
  } else {
    [rowsRaw] = await pool.query(
      `SELECT id, thread_id, from_member_id, body, created_at
         FROM chat_messages
        WHERE thread_id = ?
        ORDER BY id ASC
        LIMIT ?`,
      [threadId, PAGE_LIMIT]
    );
  }

  const messages = (rowsRaw as MessageRow[]).map((m) => ({
    id: m.id,
    fromMemberId: m.from_member_id,
    body: m.body,
    createdAt: new Date(m.created_at).toISOString(),
  }));

  return NextResponse.json({ ok: true, messages });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ threadId: string }> }) {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }
  const { threadId: rawId } = await ctx.params;
  const threadId = Number(rawId);
  if (!Number.isInteger(threadId) || threadId <= 0) {
    return NextResponse.json({ ok: false, message: "Invalid thread id." }, { status: 400 });
  }

  const thread = await loadThread(threadId, session.memberId);
  if (!thread) {
    return NextResponse.json({ ok: false, message: "Thread not found." }, { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const text = String(body.body ?? "").trim();
  if (!text) {
    return NextResponse.json({ ok: false, message: "Message is empty." }, { status: 422 });
  }
  if (text.length > MAX_BODY) {
    return NextResponse.json({ ok: false, message: `Keep messages under ${MAX_BODY} characters.` }, { status: 422 });
  }

  await pool.execute(
    "INSERT INTO chat_messages (thread_id, from_member_id, body) VALUES (?, ?, ?)",
    [threadId, session.memberId, text]
  );
  await pool.execute(
    "UPDATE chat_threads SET last_message_at = NOW() WHERE id = ?",
    [threadId]
  );

  return NextResponse.json({ ok: true });
}
