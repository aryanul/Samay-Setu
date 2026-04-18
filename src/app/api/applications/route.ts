import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

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

  const locality = String(body.locality ?? "").trim();
  const offer = String(body.offer ?? "").trim();
  const need = String(body.need ?? "").trim();
  const name = String(body.name ?? "").trim();
  const whatsappRaw = String(body.whatsapp ?? "").trim();
  const source = String(body.source ?? "north-kolkata-qr-landing").trim() || "north-kolkata-qr-landing";

  const errors: string[] = [];
  if (locality.length < 2) errors.push("Please enter your locality.");
  if (offer.length < 6) errors.push("Please add a meaningful skill or hobby offer.");
  if (need.length < 6) errors.push("Please add one help request.");
  if (name.length < 2) errors.push("Please enter your name.");
  const digits = whatsappRaw.replace(/\D+/g, "");
  if (digits.length < 10) errors.push("Please enter a valid WhatsApp number.");

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, message: errors[0], errors },
      { status: 422 }
    );
  }

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");

  try {
    await pool.execute(
      "INSERT INTO applications (locality, offer, need, name, whatsapp, source, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [locality, offer, need, name, digits, source, ip, userAgent]
    );
  } catch (err) {
    console.error("[applications] insert failed:", err);
    return NextResponse.json(
      { ok: false, message: "Unable to save your application right now. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Application received." });
}
