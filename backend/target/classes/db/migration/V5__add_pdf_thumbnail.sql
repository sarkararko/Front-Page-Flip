-- =============================================================================
-- Migration V5: Add thumbnail_url and thumbnail_public_id to pdf_documents
-- =============================================================================

ALTER TABLE pdf_documents ADD COLUMN thumbnail_url VARCHAR(1024) NULL;
ALTER TABLE pdf_documents ADD COLUMN thumbnail_public_id VARCHAR(255) NULL;

CREATE INDEX idx_pdf_thumbnail_public_id ON pdf_documents (thumbnail_public_id);
