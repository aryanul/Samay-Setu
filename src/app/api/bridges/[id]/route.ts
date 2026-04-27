import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";
import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

export const runtime = "nodejs";

type BridgeRow = {
  id: number;
  from_member_id: number;
  to_member_id: number;
  status: "pending" | "accepted" | "declined";
};

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  const { id: rawId } = await ctx.params;
  const bridgeId = Number(rawId);
  if (!Number.isInteger(bridgeId) || bridgeId <= 0) {
    return NextResponse.json({ ok: false, message: "Invalid bridge id." }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const action = String(body.action ?? "");
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ ok: false, message: "Unknown action." }, { status: 400 });
  }

  let conn: PoolConnection | null = null;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [rowsRaw] = await conn.query(
      "SELECT id, from_member_id, to_member_id, status FROM bridges WHERE id = ? FOR UPDATE",
      [bridgeId]
    );
    const rows = rowsRaw as BridgeRow[];
    const bridge = rows[0];
    if (!bridge) {
      await conn.rollback();
      return NextResponse.json({ ok: false, message: "Bridge not found." }, { status: 404 });
    }
    if (bridge.to_member_id !== session.memberId) {
      await conn.rollback();
      return NextResponse.json({ ok: false, message: "Only the recipient can respond." }, { status: 403 });
    }
    if (bridge.status !== "pending") {
      await conn.rollback();
      return NextResponse.json({ ok: false, message: "This offer has already been responded to." }, { status: 409 });
    }

    const newStatus = action === "accept" ? "accepted" : "declined";
    await conn.execute(
      "UPDATE bridges SET status = ?, responded_at = NOW() WHERE id = ?",
      [newStatus, bridgeId]
    );

    let threadId: number | null = null;
    if (newStatus === "accepted") {
      const memberA = Math.min(bridge.from_member_id, bridge.to_member_id);
      const memberB = Math.max(bridge.from_member_id, bridge.to_member_id);
      const [insertResult] = await conn.execute(
        "INSERT INTO chat_threads (bridge_id, member_a_id, member_b_id) VALUES (?, ?, ?)",
        [bridgeId, memberA, memberB]
      );
      threadId = (insertResult as ResultSetHeader).insertId;
    }

    await conn.commit();
    return NextResponse.json({ ok: true, status: newStatus, threadId });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("[bridges/PATCH] failed:", err);
    return NextResponse.json({ ok: false, message: "Could not update offer." }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
