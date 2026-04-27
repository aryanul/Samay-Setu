import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readMemberSession } from "@/lib/member-session";

export const runtime = "nodejs";

type MeRow = {
  id: number;
  full_name: string;
  professional_title: string | null;
  profile_picture_url: string | null;
  email: string | null;
  primary_expertise: string;
  current_need: string;
  proof_of_wisdom_url: string;
  is_visible: number;
};

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }
  const [rowsRaw] = await pool.query(
    `SELECT id, full_name, professional_title, profile_picture_url, email,
            primary_expertise, current_need, proof_of_wisdom_url, is_visible
       FROM verified_architect_onboarding
      WHERE id = ? LIMIT 1`,
    [session.memberId]
  );
  const rows = rowsRaw as MeRow[];
  const me = rows[0];
  if (!me) {
    return NextResponse.json({ ok: false, message: "Profile not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, me });
}

export async function PATCH(req: NextRequest) {
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

  const primaryExpertise = String(body.primaryExpertise ?? "").trim();
  const currentNeed = String(body.currentNeed ?? "").trim();
  const proofUrl = String(body.proofOfWisdomUrl ?? "").trim();

  const errors: string[] = [];
  if (primaryExpertise.length < 3) errors.push("Add your primary area of expertise.");
  if (currentNeed.length < 6) errors.push("Describe a concrete need.");
  if (!proofUrl || !isValidHttpUrl(proofUrl)) errors.push("Provide a valid proof URL.");
  if (errors.length > 0) {
    return NextResponse.json({ ok: false, message: errors[0], errors }, { status: 422 });
  }

  await pool.execute(
    `UPDATE verified_architect_onboarding
        SET primary_expertise = ?, current_need = ?, proof_of_wisdom_url = ?
      WHERE id = ?`,
    [primaryExpertise, currentNeed, proofUrl, session.memberId]
  );

  return NextResponse.json({ ok: true });
}
