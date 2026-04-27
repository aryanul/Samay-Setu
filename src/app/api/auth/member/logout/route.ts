import { NextResponse } from "next/server";
import { clearMemberSession } from "@/lib/member-session";

export const runtime = "nodejs";

export async function POST() {
  await clearMemberSession();
  return NextResponse.json({ ok: true });
}
