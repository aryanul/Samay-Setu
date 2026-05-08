import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";

export const runtime = "nodejs";

const MAX_SKILL = 255;
const MAX_LOCATION = 255;

type TradeRow = {
  id: number;
  member_id: number;
  status: "open" | "matched" | "closed";
};

function trimAndCheck(value: unknown, label: string, max: number): string | { error: string } {
  if (typeof value !== "string") return { error: `${label} is required.` };
  const trimmed = value.trim();
  if (!trimmed) return { error: `${label} is required.` };
  if (trimmed.length > max) return { error: `Keep ${label.toLowerCase()} under ${max} characters.` };
  return trimmed;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  const { id: rawId } = await ctx.params;
  const tradeId = Number(rawId);
  if (!Number.isInteger(tradeId) || tradeId <= 0) {
    return NextResponse.json({ ok: false, message: "Invalid trade id." }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const [rowsRaw] = await pool.query(
    "SELECT id, member_id, status FROM trades WHERE id = ? LIMIT 1",
    [tradeId]
  );
  const row = (rowsRaw as TradeRow[])[0];
  if (!row) {
    return NextResponse.json({ ok: false, message: "Trade not found." }, { status: 404 });
  }
  if (row.member_id !== session.memberId) {
    return NextResponse.json({ ok: false, message: "Only the owner can edit this trade." }, { status: 403 });
  }

  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (body.skillOffered !== undefined) {
    const v = trimAndCheck(body.skillOffered, "Skill offered", MAX_SKILL);
    if (typeof v !== "string") {
      return NextResponse.json({ ok: false, message: v.error }, { status: 422 });
    }
    updates.push("skill_offered = ?");
    params.push(v);
  }
  if (body.skillNeeded !== undefined) {
    const v = trimAndCheck(body.skillNeeded, "Skill needed", MAX_SKILL);
    if (typeof v !== "string") {
      return NextResponse.json({ ok: false, message: v.error }, { status: 422 });
    }
    updates.push("skill_needed = ?");
    params.push(v);
  }
  if (body.locationPreference !== undefined) {
    if (body.locationPreference === null || body.locationPreference === "") {
      updates.push("location_preference = NULL");
    } else {
      const v = trimAndCheck(body.locationPreference, "Location", MAX_LOCATION);
      if (typeof v !== "string") {
        return NextResponse.json({ ok: false, message: v.error }, { status: 422 });
      }
      updates.push("location_preference = ?");
      params.push(v);
    }
  }
  if (body.status !== undefined) {
    const next = String(body.status);
    if (next !== "open" && next !== "closed") {
      return NextResponse.json(
        { ok: false, message: "Trade status can only be set to 'open' or 'closed'." },
        { status: 422 }
      );
    }
    if (row.status === "matched") {
      return NextResponse.json(
        { ok: false, message: "A matched trade can't be reopened or closed manually." },
        { status: 409 }
      );
    }
    updates.push("status = ?");
    params.push(next);
  }

  if (updates.length === 0) {
    return NextResponse.json({ ok: false, message: "Nothing to update." }, { status: 422 });
  }

  params.push(tradeId);
  await pool.execute(`UPDATE trades SET ${updates.join(", ")} WHERE id = ?`, params);

  return NextResponse.json({ ok: true });
}
