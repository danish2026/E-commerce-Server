-- Fix NULL email issue in users table
-- This script deletes users with NULL emails so TypeORM can add the NOT NULL constraint

-- First, check how many users have NULL emails
SELECT COUNT(*) as null_email_count 
FROM users 
WHERE email IS NULL;

-- Delete users with NULL emails (since email is required)
-- WARNING: This will permanently delete these users!
DELETE FROM users 
WHERE email IS NULL;

-- Verify the fix
SELECT COUNT(*) as remaining_null_emails 
FROM users 
WHERE email IS NULL;

-- If the count is 0, you're good to go!
-- If you want to see which users were deleted, uncomment the line below:
-- SELECT id, "firstName", "lastName", role FROM users WHERE email IS NULL;

