import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { consumeLoginToken } from "@/lib/magic-link";
import { createMemberSession } from "@/lib/member-session";
import { getAppBaseUrl } from "@/lib/linkedin-oauth";

export const runtime = "nodejs";

type MemberRow = { id: number; full_name: string };

export async function GET(req: NextRequest) {
  const base = getAppBaseUrl();
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${base}/login?error=missing_token`);
  }

  try {
    const memberId = await consumeLoginToken(token);
    if (!memberId) {
      return NextResponse.redirect(`${base}/login?error=expired`);
    }

    const [rowsRaw] = await pool.query(
      "SELECT id, full_name FROM verified_architect_onboarding WHERE id = ? AND is_visible = 1 LIMIT 1",
      [memberId]
    );
    const rows = rowsRaw as MemberRow[];
    const member = rows[0];
    if (!member) {
      return NextResponse.redirect(`${base}/login?error=expired`);
    }

    await createMemberSession({ memberId: member.id, name: member.full_name });
    return NextResponse.redirect(`${base}/dashboard`);
  } catch (e) {
    console.error("[magic-link/consume] failed:", e);
    return NextResponse.redirect(`${base}/login?error=expired`);
  }
}
