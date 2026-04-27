import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { issueLoginToken } from "@/lib/magic-link";
import { getAppBaseUrl } from "@/lib/linkedin-oauth";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type MemberRow = { id: number; full_name: string; email: string };

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, message: "Please enter a valid email address." },
      { status: 422 }
    );
  }

  // Always respond identically — never confirm whether an email exists.
  const generic = {
    ok: true,
    message: "If that email matches a member, a sign-in link is on its way.",
  };

  try {
    const [rowsRaw] = await pool.query(
      "SELECT id, full_name, email FROM verified_architect_onboarding WHERE LOWER(email) = ? AND is_visible = 1 LIMIT 1",
      [email]
    );
    const rows = rowsRaw as MemberRow[];
    const member = rows[0];
    if (!member) {
      return NextResponse.json(generic);
    }

    const token = await issueLoginToken(member.id);
    const link = `${getAppBaseUrl()}/api/auth/member/magic-link/consume?token=${encodeURIComponent(token)}`;

    await sendMail({
      to: member.email,
      subject: "Your Samay Setu sign-in link",
      text: `Hi ${member.full_name},\n\nClick to sign in (valid for 15 minutes):\n${link}\n\nIf you did not request this, ignore this email.`,
      html: `<p>Hi ${member.full_name},</p>
             <p>Click to sign in (valid for 15 minutes):</p>
             <p><a href="${link}">${link}</a></p>
             <p style="color:#777">If you did not request this, ignore this email.</p>`,
    });
  } catch (err) {
    console.error("[magic-link/request] failed:", err);
    // Still respond identically so we don't leak failure modes.
  }

  return NextResponse.json(generic);
}
