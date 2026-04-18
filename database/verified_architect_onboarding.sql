-- Run once against your MySQL database (same as DATABASE_URL).
-- Stores "Verified Architect" onboarding submissions after LinkedIn + pillars + proof.

CREATE TABLE IF NOT EXISTS verified_architect_onboarding (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
