import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createArchitectDraft } from "@/lib/architect-draft";
import { exchangeCodeForTokens, fetchLinkedInProfile, getAppBaseUrl } from "@/lib/linkedin-oauth";
import { pool } from "@/lib/db";
import { createMemberSession } from "@/lib/member-session";

export const runtime = "nodejs";

const STATE_COOKIE = "ss_linkedin_oauth_state";

type ExistingMemberRow = { id: number; full_name: string };

export async function GET(req: NextRequest) {
  const base = getAppBaseUrl();
  const error = req.nextUrl.searchParams.get("error");
  const errorDescription = req.nextUrl.searchParams.get("error_description");
  if (error) {
    console.warn("[linkedin oauth] provider error:", error, errorDescription);
    return NextResponse.redirect(`${base}/onboarding?error=${encodeURIComponent(error)}`);
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value;

  jar.set(STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(`${base}/onboarding?error=invalid_state`);
  }

  try {
    const { access_token } = await exchangeCodeForTokens(code);
    const profile = await fetchLinkedInProfile(access_token);

    const [rowsRaw] = await pool.query(
      "SELECT id, full_name FROM verified_architect_onboarding WHERE linkedin_sub = ? LIMIT 1",
      [profile.linkedin_sub]
    );
    const rows = rowsRaw as ExistingMemberRow[];
    const existing = rows[0];
    if (existing) {
      await createMemberSession({ memberId: existing.id, name: existing.full_name });
      return NextResponse.redirect(`${base}/dashboard`);
    }

    await createArchitectDraft({
      linkedin_sub: profile.linkedin_sub,
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
      headline: profile.headline,
    });
    return NextResponse.redirect(`${base}/onboarding?verified=1`);
  } catch (e) {
    console.error("[linkedin oauth] callback failed:", e);
    return NextResponse.redirect(`${base}/onboarding?error=callback_failed`);
  }
}
