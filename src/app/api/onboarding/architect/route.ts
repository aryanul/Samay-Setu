import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { clearArchitectDraft, readArchitectDraft } from "@/lib/architect-draft";
import { clientIp } from "@/lib/req";
import { createMemberSession } from "@/lib/member-session";

export const runtime = "nodejs";

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const draft = await readArchitectDraft();
  if (!draft) {
    return NextResponse.json(
      { ok: false, message: "Please verify with LinkedIn first." },
      { status: 401 }
    );
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
  const source = String(body.source ?? "verified-architect-onboarding").trim() || "verified-architect-onboarding";

  const errors: string[] = [];
  if (primaryExpertise.length < 3) {
    errors.push("Please describe your primary expertise (at least a few characters).");
  }
  if (currentNeed.length < 6) {
    errors.push("Please describe what you need help with.");
  }
  if (!proofUrl || !isValidHttpUrl(proofUrl)) {
    errors.push("Please paste a valid link to your proof of practice (article or LinkedIn post).");
  }

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, message: errors[0], errors }, { status: 422 });
  }

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");

  let memberId: number;
  try {
    const [result] = await pool.execute(
      `INSERT INTO verified_architect_onboarding (
        linkedin_sub, full_name, professional_title, profile_picture_url, email,
        primary_expertise, current_need, proof_of_wisdom_url, source, ip, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        draft.linkedin_sub,
        draft.name,
        draft.headline ?? null,
        draft.picture ?? null,
        draft.email ?? null,
        primaryExpertise,
        currentNeed,
        proofUrl,
        source,
        ip,
        userAgent,
      ]
    );
    memberId = (result as { insertId: number }).insertId;
  } catch (err: unknown) {
    const e = err as { code?: string; errno?: number; sqlMessage?: string };
    const code = typeof e.code === "string" ? e.code : "";

    if (code === "ER_DUP_ENTRY" || e.errno === 1062) {
      return NextResponse.json(
        {
          ok: false,
          message: "This LinkedIn profile has already completed Verified Architect onboarding.",
        },
        { status: 409 }
      );
    }

    /** Table was never created — run `database/verified_architect_onboarding.sql` on your MySQL database. */
    if (code === "ER_NO_SUCH_TABLE" || e.errno === 1146) {
      console.error("[onboarding/architect] missing table verified_architect_onboarding — run database/verified_architect_onboarding.sql");
      return NextResponse.json(
        {
          ok: false,
          message:
            "Database is not set up for this step yet. On the server that owns DATABASE_URL, run the SQL file database/verified_architect_onboarding.sql once (e.g. MySQL Workbench or mysql CLI), then try again.",
        },
        { status: 503 }
      );
    }

    console.error("[onboarding/architect] insert failed:", err);
    const hint =
      process.env.NODE_ENV === "development" && e.sqlMessage
        ? ` (${e.sqlMessage})`
        : "";
    return NextResponse.json(
      {
        ok: false,
        message: `Unable to save your profile right now. Please try again.${hint}`,
      },
      { status: 500 }
    );
  }

  const displayName = draft.name;
  await clearArchitectDraft();
  await createMemberSession({ memberId, name: displayName });
  return NextResponse.json({
    ok: true,
    message: "Your Verified Architect profile is submitted.",
    displayName,
    redirect: "/dashboard",
  });
}
