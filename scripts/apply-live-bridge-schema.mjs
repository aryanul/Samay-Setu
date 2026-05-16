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

// Strip -- line comments, then split on every ';'. Our SQL has no stored procs
// or strings containing ';', so this is safe. TiDB rejects multi-statement
// queries by default, so each statement must be sent individually.
const statements = sql
  .replace(/^\s*--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

let connection;
try {
  connection = await mysql.createConnection({
    uri: url,
    timezone: "Z",
    multipleStatements: false,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
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
