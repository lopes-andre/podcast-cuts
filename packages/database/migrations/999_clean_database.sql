-- ⚠️ DANGER: This script will DELETE ALL DATA from the database
-- Use this ONLY for development/testing purposes
-- Run this in Supabase SQL Editor or via psql

-- Disable triggers temporarily for faster deletion
SET session_replication_role = 'replica';

-- Delete all data (order matters due to foreign key constraints)
-- Start with the most dependent tables first

DELETE FROM highlight_comments;
DELETE FROM highlight_segments;
DELETE FROM segment_speakers;
DELETE FROM highlights;
DELETE FROM segments;
DELETE FROM speakers;
DELETE FROM episode_comments;
DELETE FROM episodes;
DELETE FROM prompts;
DELETE FROM social_profiles;
DELETE FROM highlight_profiles;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Optional: Vacuum to reclaim space
VACUUM FULL;

-- Verify all tables are empty
SELECT 'episodes' as table_name, COUNT(*) as count FROM episodes
UNION ALL
SELECT 'segments', COUNT(*) FROM segments
UNION ALL
SELECT 'speakers', COUNT(*) FROM speakers
UNION ALL
SELECT 'segment_speakers', COUNT(*) FROM segment_speakers
UNION ALL
SELECT 'highlights', COUNT(*) FROM highlights
UNION ALL
SELECT 'highlight_comments', COUNT(*) FROM highlight_comments
UNION ALL
SELECT 'highlight_segments', COUNT(*) FROM highlight_segments
UNION ALL
SELECT 'episode_comments', COUNT(*) FROM episode_comments
UNION ALL
SELECT 'prompts', COUNT(*) FROM prompts
UNION ALL
SELECT 'social_profiles', COUNT(*) FROM social_profiles
UNION ALL
SELECT 'highlight_profiles', COUNT(*) FROM highlight_profiles;

