-- =============================================================================
-- Migration V8: Performance Optimization Indexes
-- Optimize query performance for dashboard stats, PDF queries, and category lookups
-- =============================================================================

-- Composite index to accelerate published PDFs by subject ordered by createdAt
CREATE INDEX idx_pdf_subject_published_created ON pdf_documents (subject_id, is_published, created_at DESC);

-- Composite index to accelerate global published PDFs feed ordered by createdAt
CREATE INDEX idx_pdf_published_created ON pdf_documents (is_published, created_at DESC);

-- Index for users by role and createdAt (accelerates admin student list and student queries)
CREATE INDEX idx_users_role_created ON users (role, created_at DESC);
