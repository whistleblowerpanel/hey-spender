-- Add suspended_by field to users table to track who suspended the user
-- This will help distinguish between admin suspensions and self-deactivations

ALTER TABLE users 
ADD COLUMN suspended_by VARCHAR(255) DEFAULT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN users.suspended_by IS 'Tracks who suspended the user: "admin" for admin suspension, "self" for self-deactivation, NULL for active users';

-- Update existing inactive users to have "self" as default (assuming they were self-deactivated)
UPDATE users 
SET suspended_by = 'self' 
WHERE is_active = false AND suspended_by IS NULL;
