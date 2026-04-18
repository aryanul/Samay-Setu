/**
 * Creates `verified_architect_onboarding` on your MySQL database using DATABASE_URL.
 * Use this when you cannot import SQL via Railway’s UI (same result as running the .sql file).
 *
 * Usage (from project root, Node 20.6+):
 *   npm run db:verified-architect
 *
 * Requires DATABASE_URL in .env.local (copy the variable from Railway → your MySQL service → Variables).
 * If Railway blocks outside connections, run this from a Railway one-off shell or enable public TCP.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sqlPath = path.join(root, "database", "verified_architect_onboarding.sql");

const url = process.env.DATABASE_URL?.trim() || process.env.MYSQL_URL?.trim();
if (!url) {
  console.error(
    "DATABASE_URL or MYSQL_URL is not set.\n" +
      "  1. Copy DATABASE_URL (or MYSQL_URL) from Railway → MySQL → Variables into .env.local\n" +
      "  2. Run: npm run db:verified-architect\n" +
      "\n" +
      "If `node --env-file` is unsupported, set DATABASE_URL in the shell first, then:\n" +
      "  node scripts/apply-verified-architect-schema.mjs"
  );
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");

let connection;
try {
  connection = await mysql.createConnection({
    uri: url,
    timezone: "Z",
    multipleStatements: false,
  });
  await connection.query(sql);
  console.log("OK: table `verified_architect_onboarding` is ready (CREATE TABLE IF NOT EXISTS).");
} catch (e) {
  console.error("Failed to apply schema:", e.message || e);
  if (e.code === "ENOTFOUND" || e.code === "ECONNREFUSED") {
    console.error(
      "\nHint: Cannot reach the database host. On Railway, open MySQL → Settings → enable public networking (or run this script inside Railway’s environment)."
    );
  }
  process.exit(1);
} finally {
  if (connection) await connection.end();
}
