-- =============================================================================
-- Migration V2: Add last_active_at for live active student presence tracking
-- =============================================================================

ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP NULL;

CREATE INDEX idx_user_role_last_active ON users (role, account_status, last_active_at);
