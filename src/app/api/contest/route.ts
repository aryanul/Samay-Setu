import { NextResponse } from "next/server";
import { readMemberSession } from "@/lib/member-session";
import { getContestSnapshot } from "@/lib/contest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Live snapshot of the Founding Race from the signed-in member's perspective. */
export async function GET() {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not signed in." }, { status: 401 });
  }

  try {
    const snapshot = await getContestSnapshot(session.memberId);
    return NextResponse.json({ ok: true, snapshot });
  } catch (err) {
    console.error("[api/contest] failed:", err);
    return NextResponse.json(
      { ok: false, message: "Could not load the race right now." },
      { status: 500 }
    );
  }
}
