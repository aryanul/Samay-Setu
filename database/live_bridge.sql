-- Live Bridge schema: members-only feed, Bridge handshake, native chat.
-- Idempotent. Safe to re-run. Runs against the same MySQL as DATABASE_URL.
--
-- Apply with:  npm run db:live-bridge
-- (or import via MySQL Workbench / mysql CLI)

-- 1. Soft kill-switch + edit timestamp on the existing member table
--    (verified_architect_onboarding.id IS the member id — no separate users table)
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'verified_architect_onboarding'
    AND COLUMN_NAME = 'is_visible'
);
SET @stmt := IF(@col_exists = 0,
  'ALTER TABLE verified_architect_onboarding ADD COLUMN is_visible TINYINT(1) NOT NULL DEFAULT 1',
  'SELECT 1');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'verified_architect_onboarding'
    AND COLUMN_NAME = 'updated_at'
);
SET @stmt := IF(@col_exists = 0,
  'ALTER TABLE verified_architect_onboarding ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1');
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;


-- 2. Magic-link login tokens (fallback auth)
CREATE TABLE IF NOT EXISTS member_login_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,                 -- sha256 hex of the plain token
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_member_login_token_hash (token_hash),
  KEY idx_member_login_tokens_member (member_id),
  KEY idx_member_login_tokens_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. Bridge offers
CREATE TABLE IF NOT EXISTS bridges (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  from_member_id BIGINT UNSIGNED NOT NULL,
  to_member_id BIGINT UNSIGNED NOT NULL,
  note VARCHAR(280) NOT NULL,
  status ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_bridges_to_status (to_member_id, status),
  KEY idx_bridges_from_status (from_member_id, status),
  KEY idx_bridges_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4. Chat threads (one per accepted bridge)
CREATE TABLE IF NOT EXISTS chat_threads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bridge_id BIGINT UNSIGNED NOT NULL,
  member_a_id BIGINT UNSIGNED NOT NULL,         -- canonical: smaller id
  member_b_id BIGINT UNSIGNED NOT NULL,         -- canonical: larger id
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_chat_threads_bridge (bridge_id),
  KEY idx_chat_threads_member_a (member_a_id),
  KEY idx_chat_threads_member_b (member_b_id),
  KEY idx_chat_threads_last_message (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 5. Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  thread_id BIGINT UNSIGNED NOT NULL,
  from_member_id BIGINT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_chat_messages_thread_created (thread_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
