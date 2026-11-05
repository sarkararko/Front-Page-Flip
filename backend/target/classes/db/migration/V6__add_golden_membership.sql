-- =============================================================================
-- Migration V6: Add Golden membership and payment fields to users table
-- =============================================================================

ALTER TABLE users ADD COLUMN is_golden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN golden_plan VARCHAR(64) NULL;
ALTER TABLE users ADD COLUMN payment_status VARCHAR(32) NOT NULL DEFAULT 'NONE';
ALTER TABLE users ADD COLUMN payment_order_id VARCHAR(128) NULL;
ALTER TABLE users ADD COLUMN golden_purchased_at TIMESTAMP NULL;

CREATE INDEX idx_users_is_golden ON users (is_golden);
