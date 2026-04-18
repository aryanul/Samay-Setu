import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
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

const conn = await mysql.createConnection(url);

console.log("Creating tables...");

await conn.query(`
  CREATE TABLE IF NOT EXISTS waitlist_emails (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(255) NOT NULL,
    source VARCHAR(120) NOT NULL DEFAULT 'homepage-early-access',
    ip VARCHAR(64) NULL,
    user_agent TEXT NULL,
    PRIMARY KEY (id),
    KEY idx_waitlist_created (created_at),
    KEY idx_waitlist_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS applications (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locality VARCHAR(120) NOT NULL,
    offer TEXT NOT NULL,
    need TEXT NOT NULL,
    name VARCHAR(120) NOT NULL,
    whatsapp VARCHAR(32) NOT NULL,
    source VARCHAR(120) NOT NULL DEFAULT 'north-kolkata-qr-landing',
    ip VARCHAR(64) NULL,
    user_agent TEXT NULL,
    PRIMARY KEY (id),
    KEY idx_applications_created (created_at),
    KEY idx_applications_locality (locality)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_username (username)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

console.log("Tables ready.");

const username = process.env.ADMIN_INITIAL_USERNAME;
const password = process.env.ADMIN_INITIAL_PASSWORD;

if (username && password) {
  const [rows] = await conn.query("SELECT id FROM admin_users WHERE username = ? LIMIT 1", [username]);
  if (Array.isArray(rows) && rows.length === 0) {
    const hash = await bcrypt.hash(password, 12);
    await conn.query("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)", [username, hash]);
    console.log(`Seeded admin user: ${username}`);
  } else {
    console.log(`Admin user "${username}" already exists, skipping seed.`);
  }
} else {
  console.log("ADMIN_INITIAL_USERNAME / ADMIN_INITIAL_PASSWORD not set, skipping admin seed.");
}

await conn.end();
console.log("Done.");
