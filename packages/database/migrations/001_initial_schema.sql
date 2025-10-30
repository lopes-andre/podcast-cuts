-- Initial database schema for Podcast Highlighter
-- Run this migration on your Supabase instance

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create episode status enum
CREATE TYPE episode_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create highlight status enum
CREATE TYPE highlight_status AS ENUM ('pending', 'used', 'discarded');

-- Create social platform enum
CREATE TYPE social_platform AS ENUM ('instagram', 'tiktok', 'linkedin', 'youtube_shorts');

-- Episodes table
CREATE TABLE episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    youtube_url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    raw_video_link TEXT,
    published_video_link TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    full_transcript TEXT,
    status episode_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Segments table (transcription segments)
CREATE TABLE segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    start_s DOUBLE PRECISION NOT NULL,
    end_s DOUBLE PRECISION NOT NULL,
    text TEXT NOT NULL,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Speakers table
CREATE TABLE speakers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    speaker_label TEXT NOT NULL,
    mapped_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(episode_id, speaker_label)
);

-- Segment speakers junction table (many-to-many)
CREATE TABLE segment_speakers (
    segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    PRIMARY KEY (segment_id, speaker_id)
);

-- Prompts table (versioned templates)
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    template_text TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, version)
);

-- Highlights table
CREATE TABLE highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
    start_s DOUBLE PRECISION NOT NULL,
    end_s DOUBLE PRECISION NOT NULL,
    transcript TEXT NOT NULL,
    status highlight_status NOT NULL DEFAULT 'pending',
    comments TEXT,
    raw_video_link TEXT,
    edited_video_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social profiles table
CREATE TABLE social_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform social_platform NOT NULL,
    profile_name TEXT NOT NULL,
    profile_handle TEXT,
    profile_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Highlight profiles junction table (many-to-many)
CREATE TABLE highlight_profiles (
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
    posted_at TIMESTAMP WITH TIME ZONE,
    post_url TEXT,
    PRIMARY KEY (highlight_id, profile_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_episodes_status ON episodes(status);
CREATE INDEX idx_episodes_created_at ON episodes(created_at DESC);
CREATE INDEX idx_segments_episode_id ON segments(episode_id);
CREATE INDEX idx_segments_time ON segments(start_s, end_s);
CREATE INDEX idx_speakers_episode_id ON speakers(episode_id);
CREATE INDEX idx_highlights_episode_id ON highlights(episode_id);
CREATE INDEX idx_highlights_status ON highlights(status);
CREATE INDEX idx_highlights_created_at ON highlights(created_at DESC);
CREATE INDEX idx_prompts_active ON prompts(is_active) WHERE is_active = true;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to episodes
CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON episodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to highlights
CREATE TRIGGER update_highlights_updated_at BEFORE UPDATE ON highlights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional, configure based on your auth needs)
-- ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE social_profiles ENABLE ROW LEVEL SECURITY;

