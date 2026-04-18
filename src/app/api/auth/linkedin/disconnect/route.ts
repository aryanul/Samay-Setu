import { NextResponse } from "next/server";
import { clearArchitectDraft } from "@/lib/architect-draft";

export const runtime = "nodejs";

export async function POST() {
  await clearArchitectDraft();
  return NextResponse.json({ ok: true });
}
