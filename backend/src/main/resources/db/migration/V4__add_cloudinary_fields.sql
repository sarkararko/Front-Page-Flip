-- =============================================================================
-- Migration V4: Add Cloudinary public_id and secure_url to pdf_documents
-- =============================================================================

ALTER TABLE pdf_documents ADD COLUMN cloudinary_public_id VARCHAR(255) NULL;
ALTER TABLE pdf_documents ADD COLUMN cloudinary_secure_url VARCHAR(1024) NULL;

CREATE INDEX idx_pdf_cloudinary_public_id ON pdf_documents (cloudinary_public_id);
