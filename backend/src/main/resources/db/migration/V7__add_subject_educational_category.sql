-- =============================================================================
-- Migration V7: Add educational_category to subjects table (SCHOOL or COLLEGE)
-- =============================================================================

ALTER TABLE subjects 
ADD COLUMN educational_category VARCHAR(32) NOT NULL DEFAULT 'COLLEGE';

CREATE INDEX idx_subject_educational_category ON subjects (educational_category);
