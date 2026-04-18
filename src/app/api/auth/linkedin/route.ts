import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { buildLinkedInAuthorizeUrl, getAppBaseUrl } from "@/lib/linkedin-oauth";

export const runtime = "nodejs";

const STATE_COOKIE = "ss_linkedin_oauth_state";
const STATE_MAX_AGE = 60 * 10;

export async function GET() {
  try {
    const state = randomBytes(24).toString("hex");
    const jar = await cookies();
    jar.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: STATE_MAX_AGE,
    });
    const url = buildLinkedInAuthorizeUrl(state);
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("[linkedin oauth] start failed:", e);
    return NextResponse.redirect(`${getAppBaseUrl()}/onboarding?error=config`);
  }
}
