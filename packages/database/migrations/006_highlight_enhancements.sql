-- Migration 006: Highlight Enhancements
-- This migration adds support for:
-- 1. Highlight comments (multiple comments per highlight)
-- 2. Highlight-segment relationships (track which segments compose each highlight)
-- 3. Video links (raw and edited) for each highlight

-- =============================================================================
-- 1. Add video link fields to highlights table (if they don't exist)
-- =============================================================================

-- Check and add raw_video_link column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'highlights' AND column_name = 'raw_video_link'
    ) THEN
        ALTER TABLE highlights ADD COLUMN raw_video_link TEXT;
        COMMENT ON COLUMN highlights.raw_video_link IS 'Link to the raw/unedited video clip';
    END IF;
END $$;

-- Check and add edited_video_link column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'highlights' AND column_name = 'edited_video_link'
    ) THEN
        ALTER TABLE highlights ADD COLUMN edited_video_link TEXT;
        COMMENT ON COLUMN highlights.edited_video_link IS 'Link to the edited/finalized video clip';
    END IF;
END $$;

-- =============================================================================
-- 2. Create highlight_comments table (if it doesn't exist)
-- =============================================================================

CREATE TABLE IF NOT EXISTS highlight_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries by highlight (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_highlight_comments_highlight_id'
    ) THEN
        CREATE INDEX idx_highlight_comments_highlight_id ON highlight_comments(highlight_id);
    END IF;
END $$;

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_highlight_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS highlight_comments_updated_at ON highlight_comments;
CREATE TRIGGER highlight_comments_updated_at
    BEFORE UPDATE ON highlight_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_highlight_comments_updated_at();

COMMENT ON TABLE highlight_comments IS 'Comments and notes for individual highlights';
COMMENT ON COLUMN highlight_comments.highlight_id IS 'The highlight this comment belongs to';
COMMENT ON COLUMN highlight_comments.content IS 'Comment text content';

-- =============================================================================
-- 3. Create highlight_segments junction table (if it doesn't exist)
-- =============================================================================

CREATE TABLE IF NOT EXISTS highlight_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(highlight_id, segment_id)
);

-- Indexes for faster queries (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_highlight_segments_highlight_id'
    ) THEN
        CREATE INDEX idx_highlight_segments_highlight_id ON highlight_segments(highlight_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_highlight_segments_segment_id'
    ) THEN
        CREATE INDEX idx_highlight_segments_segment_id ON highlight_segments(segment_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_highlight_segments_order'
    ) THEN
        CREATE INDEX idx_highlight_segments_order ON highlight_segments(highlight_id, sequence_order);
    END IF;
END $$;

COMMENT ON TABLE highlight_segments IS 'Junction table linking highlights to their constituent segments with ordering';
COMMENT ON COLUMN highlight_segments.highlight_id IS 'The highlight this segment belongs to';
COMMENT ON COLUMN highlight_segments.segment_id IS 'The segment included in this highlight';
COMMENT ON COLUMN highlight_segments.sequence_order IS 'Order of this segment within the highlight (0-indexed, allows non-sequential and reordering)';

-- =============================================================================
-- 4. Update existing highlights to populate highlight_segments
-- =============================================================================

-- For existing highlights, we need to find and link their segments based on time overlap
-- This is a one-time data migration to populate the new junction table
-- Only runs if there are highlights without segments

DO $$
DECLARE
    highlight_record RECORD;
    segment_record RECORD;
    current_order INTEGER;
    unlinked_highlights INTEGER;
BEGIN
    -- Check if there are highlights that need to be linked
    SELECT COUNT(*) INTO unlinked_highlights
    FROM highlights h
    WHERE NOT EXISTS (
        SELECT 1 FROM highlight_segments hs WHERE hs.highlight_id = h.id
    );
    
    -- Only proceed if there are unlinked highlights
    IF unlinked_highlights > 0 THEN
        RAISE NOTICE 'Found % highlights without segments. Linking them now...', unlinked_highlights;
        
        -- Loop through all existing highlights that don't have segments yet
        FOR highlight_record IN 
            SELECT h.id, h.episode_id, h.start_s, h.end_s 
            FROM highlights h
            WHERE NOT EXISTS (
                SELECT 1 FROM highlight_segments hs WHERE hs.highlight_id = h.id
            )
            ORDER BY h.created_at
        LOOP
            current_order := 0;
            
            -- Find all segments that overlap with this highlight's time range
            -- A segment overlaps if: segment.start < highlight.end AND segment.end > highlight.start
            FOR segment_record IN
                SELECT id, start_s, end_s
                FROM segments
                WHERE episode_id = highlight_record.episode_id
                  AND start_s < highlight_record.end_s
                  AND end_s > highlight_record.start_s
                ORDER BY start_s
            LOOP
                -- Insert the segment-highlight relationship
                INSERT INTO highlight_segments (highlight_id, segment_id, sequence_order)
                VALUES (highlight_record.id, segment_record.id, current_order)
                ON CONFLICT (highlight_id, segment_id) DO NOTHING;
                
                current_order := current_order + 1;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Successfully linked % highlights to their segments', unlinked_highlights;
    ELSE
        RAISE NOTICE 'No unlinked highlights found. Skipping data migration.';
    END IF;
END $$;

-- =============================================================================
-- 5. Verify migration
-- =============================================================================

-- Check that tables were created successfully
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'highlight_comments') THEN
        RAISE EXCEPTION 'Migration failed: highlight_comments table not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'highlight_segments') THEN
        RAISE EXCEPTION 'Migration failed: highlight_segments table not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'highlights' AND column_name = 'raw_video_link'
    ) THEN
        RAISE EXCEPTION 'Migration failed: raw_video_link column not added to highlights';
    END IF;
    
    RAISE NOTICE 'Migration 006 completed successfully!';
    RAISE NOTICE 'Tables created: highlight_comments, highlight_segments';
    RAISE NOTICE 'Columns added: highlights.raw_video_link, highlights.edited_video_link';
    RAISE NOTICE 'Existing highlights linked to segments: %', (SELECT COUNT(*) FROM highlight_segments);
END $$;

