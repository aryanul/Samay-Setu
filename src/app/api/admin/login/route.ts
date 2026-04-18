import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { createAdminSession } from "@/lib/session";

export const runtime = "nodejs";

type AdminRow = {
  id: number;
  username: string;
  password_hash: string;
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");

  if (!username || !password) {
    return NextResponse.json({ ok: false, message: "Username and password are required." }, { status: 400 });
  }

  const [rowsRaw] = await pool.query(
    "SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1",
    [username]
  );
  const rows = rowsRaw as AdminRow[];
  const user = rows[0];

  const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!user || !ok) {
    return NextResponse.json({ ok: false, message: "Invalid username or password." }, { status: 401 });
  }

  await pool.execute("UPDATE admin_users SET last_login_at = NOW() WHERE id = ?", [user.id]);

  await createAdminSession({ sub: String(user.id), username: user.username });
  return NextResponse.json({ ok: true });
}
