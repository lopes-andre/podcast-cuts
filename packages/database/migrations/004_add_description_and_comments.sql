-- Migration 004: Add description field and comments table
-- This migration:
-- 1. Adds description field to episodes table
-- 2. Removes published_video_link (redundant with youtube_url)
-- 3. Creates episode_comments table for multiple comments per episode

-- Add description field to episodes
ALTER TABLE episodes
ADD COLUMN description TEXT;

-- Remove published_video_link (it's redundant with youtube_url)
ALTER TABLE episodes
DROP COLUMN IF EXISTS published_video_link;

-- Create episode_comments table
CREATE TABLE episode_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster comment queries by episode
CREATE INDEX idx_episode_comments_episode_id ON episode_comments(episode_id);

-- Create trigger to update updated_at timestamp on episode_comments
CREATE OR REPLACE FUNCTION update_episode_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER episode_comments_updated_at
    BEFORE UPDATE ON episode_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_episode_comments_updated_at();

