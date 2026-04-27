import { createHash, randomBytes } from "crypto";
import { pool } from "@/lib/db";

const TOKEN_BYTES = 32;
const TTL_MINUTES = 15;

function hashToken(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

export async function issueLoginToken(memberId: number): Promise<string> {
  const plain = randomBytes(TOKEN_BYTES).toString("hex");
  const token_hash = hashToken(plain);
  await pool.execute(
    `INSERT INTO member_login_tokens (member_id, token_hash, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [memberId, token_hash, TTL_MINUTES]
  );
  return plain;
}

type TokenRow = {
  id: number;
  member_id: number;
};

export async function consumeLoginToken(plain: string): Promise<number | null> {
  if (!plain || typeof plain !== "string") return null;
  const token_hash = hashToken(plain);
  const [rowsRaw] = await pool.query(
    `SELECT id, member_id
       FROM member_login_tokens
      WHERE token_hash = ?
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1`,
    [token_hash]
  );
  const rows = rowsRaw as TokenRow[];
  const row = rows[0];
  if (!row) return null;
  await pool.execute(
    "UPDATE member_login_tokens SET used_at = NOW() WHERE id = ?",
    [row.id]
  );
  return row.member_id;
}
