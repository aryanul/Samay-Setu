/**
 * Single source of truth for the application's MySQL schema.
 *
 * `ensureSchema(pool)` is run exactly once per Node process the first time
 * the shared pool is touched (see src/lib/db.ts). Every statement is
 * idempotent — safe to re-run against any environment.
 *
 * The standalone scripts under /scripts and /database remain available as a
 * manual fallback (CI, ops shells, debugging), but no human ever has to run
 * them for the app to come up on a new server.
 */

import type { Pool } from "mysql2/promise";

const TABLE_STATEMENTS: string[] = [
  // ---- Public lead-capture tables (legacy + current) -----------------------
  `CREATE TABLE IF NOT EXISTS waitlist_emails (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(255) NOT NULL,
    source VARCHAR(120) NOT NULL DEFAULT 'homepage-early-access',
    ip VARCHAR(64) NULL,
    user_agent TEXT NULL,
    PRIMARY KEY (id),
    KEY idx_waitlist_created (created_at),
    KEY idx_waitlist_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS applications (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ---- Admin console -------------------------------------------------------
  `CREATE TABLE IF NOT EXISTS admin_users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_username (username)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ---- Verified Architect onboarding (member identity) ---------------------
  `CREATE TABLE IF NOT EXISTS verified_architect_onboarding (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    linkedin_sub VARCHAR(255) NOT NULL,
    full_name VARCHAR(512) NOT NULL,
    professional_title VARCHAR(512) NULL,
    profile_picture_url TEXT NULL,
    email VARCHAR(512) NULL,
    primary_expertise TEXT NOT NULL,
    current_need TEXT NOT NULL,
    proof_of_wisdom_url TEXT NOT NULL,
    source VARCHAR(128) NOT NULL DEFAULT 'verified-architect-onboarding',
    ip VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_verified_architect_linkedin (linkedin_sub),
    KEY idx_verified_architect_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ---- Live Bridge: member auth, bridge offers, chat -----------------------
  `CREATE TABLE IF NOT EXISTS member_login_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    member_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_member_login_token_hash (token_hash),
    KEY idx_member_login_tokens_member (member_id),
    KEY idx_member_login_tokens_expires (expires_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS bridges (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    from_member_id BIGINT UNSIGNED NOT NULL,
    to_member_id BIGINT UNSIGNED NOT NULL,
    note VARCHAR(280) NOT NULL,
    status ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME NULL,
    active_pair_key VARCHAR(64) GENERATED ALWAYS AS (
      CASE WHEN status IN ('pending', 'accepted')
        THEN CONCAT(LEAST(from_member_id, to_member_id), '-', GREATEST(from_member_id, to_member_id))
        ELSE NULL
      END
    ) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uq_bridges_active_pair (active_pair_key),
    KEY idx_bridges_to_status (to_member_id, status),
    KEY idx_bridges_from_status (from_member_id, status),
    KEY idx_bridges_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS chat_threads (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    bridge_id BIGINT UNSIGNED NOT NULL,
    member_a_id BIGINT UNSIGNED NOT NULL,
    member_b_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_chat_threads_bridge (bridge_id),
    KEY idx_chat_threads_member_a (member_a_id),
    KEY idx_chat_threads_member_b (member_b_id),
    KEY idx_chat_threads_last_message (last_message_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    thread_id BIGINT UNSIGNED NOT NULL,
    from_member_id BIGINT UNSIGNED NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_chat_messages_thread_created (thread_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ---- Trade Ledger (per-doc Bridge Lifecycle) -----------------------------
  `CREATE TABLE IF NOT EXISTS trades (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    member_id BIGINT UNSIGNED NOT NULL,
    skill_offered VARCHAR(255) NOT NULL,
    skill_needed VARCHAR(255) NOT NULL,
    location_preference VARCHAR(255) NULL,
    status ENUM('open', 'matched', 'closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_trades_member (member_id),
    KEY idx_trades_status (status),
    KEY idx_trades_skill_offered (skill_offered),
    KEY idx_trades_skill_needed (skill_needed),
    KEY idx_trades_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

type ColumnAdd = {
  table: string;
  column: string;
  /** SQL fragment after `ALTER TABLE <table> ADD COLUMN ` */
  ddl: string;
};

const COLUMN_ADDS: ColumnAdd[] = [
  {
    table: "verified_architect_onboarding",
    column: "is_visible",
    ddl: "is_visible TINYINT(1) NOT NULL DEFAULT 1",
  },
  {
    table: "verified_architect_onboarding",
    column: "updated_at",
    ddl: "updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP",
  },
  {
    table: "bridges",
    column: "active_pair_key",
    ddl: `active_pair_key VARCHAR(64) GENERATED ALWAYS AS (
      CASE WHEN status IN ('pending', 'accepted')
        THEN CONCAT(LEAST(from_member_id, to_member_id), '-', GREATEST(from_member_id, to_member_id))
        ELSE NULL
      END
    ) STORED`,
  },
  {
    table: "bridges",
    column: "trade_id",
    ddl: "trade_id BIGINT UNSIGNED NULL",
  },
];

type IndexAdd = {
  table: string;
  index: string;
  /** SQL fragment after `ALTER TABLE <table> ADD ` */
  ddl: string;
};

const INDEX_ADDS: IndexAdd[] = [
  {
    table: "bridges",
    index: "uq_bridges_active_pair",
    ddl: "UNIQUE KEY uq_bridges_active_pair (active_pair_key)",
  },
];

/**
 * Receives the **raw** pool (not the proxy from src/lib/db.ts) so internal
 * queries don't recurse through the schema-ready guard. Safe to call multiple
 * times; the bootstrap in db.ts caches the resulting promise.
 */
export async function ensureSchema(pool: Pool): Promise<void> {
  for (const sql of TABLE_STATEMENTS) {
    await pool.query(sql);
  }

  for (const add of COLUMN_ADDS) {
    const [rowsRaw] = await pool.query(
      `SELECT 1
         FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        LIMIT 1`,
      [add.table, add.column]
    );
    if ((rowsRaw as unknown[]).length === 0) {
      await pool.query(`ALTER TABLE ${add.table} ADD COLUMN ${add.ddl}`);
    }
  }

  // Resolve any pre-existing duplicate active bridges between the same pair
  // before adding the unique constraint. If both an accepted and a pending
  // exist for a pair, the pending(s) are stale; if multiple pendings exist,
  // keep the oldest. Newly-declined rows have a NULL active_pair_key, which
  // unique allows in unlimited copies.
  await pool.query(
    `UPDATE bridges target
       JOIN bridges other
         ON other.active_pair_key = target.active_pair_key
        AND other.status = 'accepted'
        AND other.id <> target.id
        SET target.status = 'declined', target.responded_at = NOW()
      WHERE target.status = 'pending'`
  );
  await pool.query(
    `UPDATE bridges target
       JOIN (
         SELECT active_pair_key, MIN(id) AS keep_id
           FROM bridges
          WHERE status = 'pending'
            AND active_pair_key IS NOT NULL
          GROUP BY active_pair_key
         HAVING COUNT(*) > 1
       ) keep
         ON keep.active_pair_key = target.active_pair_key
        AND target.id <> keep.keep_id
        SET target.status = 'declined', target.responded_at = NOW()
      WHERE target.status = 'pending'`
  );

  // Backfill: every existing member with profile expertise + need but no
  // trades yet gets a single starter trade carried over from their profile.
  // Idempotent — re-runs safely because the NOT EXISTS guard skips members
  // who already have at least one trade.
  await pool.query(
    `INSERT INTO trades (member_id, skill_offered, skill_needed, status)
     SELECT m.id,
            LEFT(TRIM(m.primary_expertise), 255),
            LEFT(TRIM(m.current_need), 255),
            'open'
       FROM verified_architect_onboarding m
      WHERE m.primary_expertise IS NOT NULL
        AND m.current_need IS NOT NULL
        AND TRIM(m.primary_expertise) <> ''
        AND TRIM(m.current_need) <> ''
        AND NOT EXISTS (SELECT 1 FROM trades t WHERE t.member_id = m.id)`
  );

  for (const add of INDEX_ADDS) {
    const [rowsRaw] = await pool.query(
      `SELECT 1
         FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
        LIMIT 1`,
      [add.table, add.index]
    );
    if ((rowsRaw as unknown[]).length === 0) {
      await pool.query(`ALTER TABLE ${add.table} ADD ${add.ddl}`);
    }
  }
}
