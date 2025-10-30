-- ⚠️ DANGER: This script will DELETE ALL DATA from the database
-- Use this ONLY for development/testing purposes
-- Run this in Supabase SQL Editor or via psql

-- Delete all data (order matters due to foreign keys)
DELETE FROM segment_speakers;
DELETE FROM highlights;
DELETE FROM segments;
DELETE FROM speakers;
DELETE FROM episodes;

-- Reset any sequences (if needed in the future)
-- For UUID-based tables, this isn't necessary

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

