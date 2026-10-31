-- =============================================================================
-- Migration V3: Brevo Email Verification, Password Reset Tokens & Rate Limiting
-- =============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    token VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pwreset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pwreset_token (token),
    INDEX idx_pwreset_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users ADD COLUMN last_verification_sent_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN last_password_reset_sent_at TIMESTAMP NULL;
