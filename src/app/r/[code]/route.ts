import { NextRequest, NextResponse } from "next/server";
import { setReferralCookie } from "@/lib/referral";

export const runtime = "nodejs";

/**
 * Founding Race invite link: /r/<code>
 *
 * Stashes the referrer's code in a signed cookie (survives the LinkedIn OAuth
 * round-trip) and sends the visitor into Verified Architect onboarding. The
 * referral is recorded once they finish onboarding.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code: raw } = await ctx.params;
  const code = String(raw ?? "").trim().toLowerCase().slice(0, 48);

  if (/^[a-z0-9][a-z0-9-]{1,47}$/.test(code)) {
    try {
      await setReferralCookie(code);
    } catch (e) {
      // SESSION_SECRET missing or signing error — proceed without attribution.
      console.error("[r/code] could not set referral cookie:", e);
    }
  }

  return NextResponse.redirect(new URL("/onboarding?invited=1", req.url));
}
