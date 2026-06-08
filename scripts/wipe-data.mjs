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

const KEEP = new Set(["admin_users"]);

const conn = await mysql.createConnection({
  uri: url,
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
});

const [tables] = await conn.query(
  `SELECT TABLE_NAME AS name
     FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'`
);

if (!tables.length) {
  console.log("No tables found.");
  await conn.end();
  process.exit(0);
}

await conn.query("SET FOREIGN_KEY_CHECKS = 0");

for (const { name } of tables) {
  if (KEEP.has(name)) {
    console.log(`- ${name}: kept (admin table)`);
    continue;
  }
  const [countRows] = await conn.query(`SELECT COUNT(*) AS n FROM \`${name}\``);
  const before = countRows[0]?.n ?? 0;
  await conn.query(`TRUNCATE TABLE \`${name}\``);
  console.log(`- ${name}: cleared ${before} row(s)`);
}

await conn.query("SET FOREIGN_KEY_CHECKS = 1");
await conn.end();
console.log("Done. admin_users preserved.");
