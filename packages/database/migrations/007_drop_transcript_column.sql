-- Migration: Drop transcript column from highlights table
-- Date: 2025-10-30
-- Description: 
--   The transcript column is no longer needed because we now compute
--   transcripts dynamically from the segments in highlight_segments table.
--   This provides a single source of truth and ensures transcripts are
--   always up-to-date with the current segment composition.
--
-- IMPORTANT: This migration is OPTIONAL and IRREVERSIBLE without backup
-- Benefits:
--   - Cleaner schema
--   - No data duplication
--   - Transcript always reflects current segments
-- Considerations:
--   - Cannot rollback without database backup
--   - Loses stored transcript data (though it's recomputed anyway)
--   - May affect any external tools reading this column

-- Drop the transcript column from highlights table
ALTER TABLE highlights DROP COLUMN IF EXISTS transcript;

-- Verify the column was dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'highlights' AND column_name = 'transcript'
    ) THEN
        RAISE EXCEPTION 'Failed to drop transcript column';
    ELSE
        RAISE NOTICE 'Successfully dropped transcript column from highlights table';
    END IF;
END $$;

