import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readAdminSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await readAdminSession();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  const { id: rawId } = await ctx.params;
  const memberId = Number(rawId);
  if (!Number.isInteger(memberId) || memberId <= 0) {
    return NextResponse.json({ ok: false, message: "Invalid member id." }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const isVisible = body.is_visible === true || body.is_visible === 1;
  await pool.execute(
    "UPDATE verified_architect_onboarding SET is_visible = ? WHERE id = ?",
    [isVisible ? 1 : 0, memberId]
  );

  return NextResponse.json({ ok: true });
}
