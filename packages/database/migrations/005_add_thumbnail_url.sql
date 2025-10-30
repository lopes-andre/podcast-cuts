-- Migration 005: Add thumbnail_url to episodes
-- This migration adds a field to store YouTube video thumbnails

ALTER TABLE episodes
ADD COLUMN thumbnail_url TEXT;

-- Create index for faster queries (optional, but good for performance)
CREATE INDEX idx_episodes_thumbnail_url ON episodes(thumbnail_url) WHERE thumbnail_url IS NOT NULL;

