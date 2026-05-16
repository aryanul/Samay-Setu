import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
} catch (err) {
  console.warn("Could not read .env.local:", err.message);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing. Put it in .env.local.");
  process.exit(1);
}

const TABLES = [
  "chat_messages",
  "chat_threads",
  "bridges",
  "member_login_tokens",
  "verified_architect_onboarding",
  "waitlist_emails",
  "applications",
];

const conn = await mysql.createConnection({
  uri: url,
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
});

await conn.query("SET FOREIGN_KEY_CHECKS = 0");

for (const table of TABLES) {
  const [existsRows] = await conn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table]
  );
  if (!Array.isArray(existsRows) || existsRows.length === 0) {
    console.log(`- ${table}: not present, skipping`);
    continue;
  }
  const [countRows] = await conn.query(`SELECT COUNT(*) AS n FROM ${table}`);
  const before = countRows[0]?.n ?? 0;
  await conn.query(`TRUNCATE TABLE ${table}`);
  console.log(`- ${table}: cleared ${before} row(s)`);
}

await conn.query("SET FOREIGN_KEY_CHECKS = 1");
await conn.end();
console.log("Done. Admin users untouched.");
