-- Migration to rename 'used' status to 'approved' for highlights
-- This provides clearer semantics for the highlight workflow

-- First, update any existing 'used' values to 'approved' (temporary string)
UPDATE highlights SET status = 'approved'::text::highlight_status WHERE status = 'used';

-- Now we need to recreate the enum type
-- PostgreSQL doesn't allow modifying enums directly, so we need to:
-- 1. Remove the default value
-- 2. Create a new enum with the correct values
-- 3. Alter the column to use the new enum
-- 4. Drop the old enum
-- 5. Re-add the default value

-- Step 1: Remove the default value temporarily
ALTER TABLE highlights ALTER COLUMN status DROP DEFAULT;

-- Step 2: Create new enum type
CREATE TYPE highlight_status_new AS ENUM ('pending', 'approved', 'discarded');

-- Step 3: Alter the column to use the new type
ALTER TABLE highlights 
  ALTER COLUMN status TYPE highlight_status_new 
  USING status::text::highlight_status_new;

-- Step 4: Drop the old enum type
DROP TYPE highlight_status;

-- Step 5: Rename the new enum to the original name
ALTER TYPE highlight_status_new RENAME TO highlight_status;

-- Step 6: Re-add the default value with the new type
ALTER TABLE highlights ALTER COLUMN status SET DEFAULT 'pending'::highlight_status;

