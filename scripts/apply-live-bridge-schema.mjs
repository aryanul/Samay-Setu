/**
 * Applies database/live_bridge.sql to your MySQL database (DATABASE_URL).
 *
 * Usage (Node 20.6+):
 *   npm run db:live-bridge
 *
 * Requires DATABASE_URL in .env.local (same value as the rest of the app).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sqlPath = path.join(root, "database", "live_bridge.sql");

const url = process.env.DATABASE_URL?.trim() || process.env.MYSQL_URL?.trim();
if (!url) {
  console.error(
    "DATABASE_URL or MYSQL_URL is not set.\n" +
      "  1. Copy DATABASE_URL from your provider into .env.local\n" +
      "  2. Run: npm run db:live-bridge"
  );
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");

// Split on semicolons that end a statement. Keeps things simple — our SQL has no
// stored procs / dollar-quoted bodies, so a naive split is fine.
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

let connection;
try {
  connection = await mysql.createConnection({
    uri: url,
    timezone: "Z",
    multipleStatements: false,
  });
  for (const stmt of statements) {
    await connection.query(stmt);
  }
  console.log(`OK: applied ${statements.length} statement(s) from live_bridge.sql`);
} catch (e) {
  console.error("Failed to apply schema:", e.message || e);
  if (e.code === "ENOTFOUND" || e.code === "ECONNREFUSED") {
    console.error(
      "\nHint: Cannot reach the database host. If this is a managed DB, enable public networking or run from inside the same network."
    );
  }
  process.exit(1);
} finally {
  if (connection) await connection.end();
}
