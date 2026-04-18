import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  return real || null;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  const source = String(body.source ?? "homepage-early-access").trim() || "homepage-early-access";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, message: "Please enter a valid email address." },
      { status: 422 }
    );
  }

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");

  try {
    await pool.execute(
      "INSERT INTO waitlist_emails (email, source, ip, user_agent) VALUES (?, ?, ?, ?)",
      [email, source, ip, userAgent]
    );
  } catch (err) {
    console.error("[waitlist] insert failed:", err);
    return NextResponse.json(
      { ok: false, message: "Unable to save your request right now." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Thanks! We will notify you at launch." });
}
