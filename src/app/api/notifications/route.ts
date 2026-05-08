import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";

export const runtime = "nodejs";

type ServerNowRow = { server_now: Date };

type IncomingBridgeRow = {
  id: number;
  note: string;
  created_at: Date;
  other_id: number;
  other_name: string;
  other_picture: string | null;
};

type ResponseRow = {
  id: number;
  status: "accepted" | "declined";
  responded_at: Date;
  thread_id: number | null;
  other_id: number;
  other_name: string;
  other_picture: string | null;
};

type MessageRow = {
  msg_id: number;
  thread_id: number;
  body: string;
  created_at: Date;
  other_id: number;
  other_name: string;
  other_picture: string | null;
};

type Event =
  | {
      kind: "bridge_received";
      bridgeId: number;
      from: { id: number; name: string; picture: string | null };
      note: string;
      at: string;
    }
  | {
      kind: "bridge_accepted";
      bridgeId: number;
      threadId: number | null;
      other: { id: number; name: string; picture: string | null };
      at: string;
    }
  | {
      kind: "bridge_declined";
      bridgeId: number;
      other: { id: number; name: string; picture: string | null };
      at: string;
    }
  | {
      kind: "message_received";
      threadId: number;
      messageId: number;
      from: { id: number; name: string; picture: string | null };
      preview: string;
      at: string;
    };

const PREVIEW_LEN = 100;

function previewBody(body: string): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  return trimmed.length > PREVIEW_LEN ? trimmed.slice(0, PREVIEW_LEN) + "…" : trimmed;
}

export async function GET(req: NextRequest) {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  const sinceParam = req.nextUrl.searchParams.get("since");
  const sinceDate = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 30_000);
  if (isNaN(sinceDate.getTime())) {
    return NextResponse.json({ ok: false, message: "Invalid 'since'." }, { status: 400 });
  }

  // Snapshot 'now' before queries so the next poll cursor doesn't drop events
  // that arrive between the query and the response.
  const [nowRowsRaw] = await pool.query("SELECT NOW(3) AS server_now");
  const serverNow = (nowRowsRaw as ServerNowRow[])[0].server_now;

  const events: Event[] = [];

  const [incomingBridgesRaw] = await pool.query(
    `SELECT b.id, b.note, b.created_at,
            m.id AS other_id, m.full_name AS other_name,
            m.profile_picture_url AS other_picture
       FROM bridges b
       JOIN verified_architect_onboarding m ON m.id = b.from_member_id
      WHERE b.to_member_id = ?
        AND b.status = 'pending'
        AND b.created_at > ?
      ORDER BY b.created_at ASC
      LIMIT 50`,
    [session.memberId, sinceDate]
  );
  for (const r of incomingBridgesRaw as IncomingBridgeRow[]) {
    events.push({
      kind: "bridge_received",
      bridgeId: r.id,
      from: { id: r.other_id, name: r.other_name, picture: r.other_picture },
      note: r.note,
      at: new Date(r.created_at).toISOString(),
    });
  }

  const [responsesRaw] = await pool.query(
    `SELECT b.id, b.status, b.responded_at,
            t.id AS thread_id,
            m.id AS other_id, m.full_name AS other_name,
            m.profile_picture_url AS other_picture
       FROM bridges b
       JOIN verified_architect_onboarding m ON m.id = b.to_member_id
       LEFT JOIN chat_threads t
         ON t.member_a_id = LEAST(b.from_member_id, b.to_member_id)
        AND t.member_b_id = GREATEST(b.from_member_id, b.to_member_id)
      WHERE b.from_member_id = ?
        AND b.status IN ('accepted', 'declined')
        AND b.responded_at IS NOT NULL
        AND b.responded_at > ?
      ORDER BY b.responded_at ASC
      LIMIT 50`,
    [session.memberId, sinceDate]
  );
  for (const r of responsesRaw as ResponseRow[]) {
    if (r.status === "accepted") {
      events.push({
        kind: "bridge_accepted",
        bridgeId: r.id,
        threadId: r.thread_id ?? null,
        other: { id: r.other_id, name: r.other_name, picture: r.other_picture },
        at: new Date(r.responded_at).toISOString(),
      });
    } else {
      events.push({
        kind: "bridge_declined",
        bridgeId: r.id,
        other: { id: r.other_id, name: r.other_name, picture: r.other_picture },
        at: new Date(r.responded_at).toISOString(),
      });
    }
  }

  const [messagesRaw] = await pool.query(
    `SELECT msg.id AS msg_id, msg.thread_id, msg.body, msg.created_at,
            m.id AS other_id, m.full_name AS other_name,
            m.profile_picture_url AS other_picture
       FROM chat_messages msg
       JOIN chat_threads t ON t.id = msg.thread_id
       JOIN verified_architect_onboarding m ON m.id = msg.from_member_id
      WHERE (t.member_a_id = ? OR t.member_b_id = ?)
        AND msg.from_member_id <> ?
        AND msg.created_at > ?
      ORDER BY msg.created_at ASC
      LIMIT 50`,
    [session.memberId, session.memberId, session.memberId, sinceDate]
  );
  for (const r of messagesRaw as MessageRow[]) {
    events.push({
      kind: "message_received",
      threadId: r.thread_id,
      messageId: r.msg_id,
      from: { id: r.other_id, name: r.other_name, picture: r.other_picture },
      preview: previewBody(r.body),
      at: new Date(r.created_at).toISOString(),
    });
  }

  return NextResponse.json({
    ok: true,
    now: serverNow.toISOString(),
    events,
  });
}
