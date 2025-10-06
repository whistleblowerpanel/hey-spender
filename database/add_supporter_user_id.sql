-- Add supporter_user_id column to contributions table
-- This column will link contributions to the user who made them

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contributions' 
        AND column_name = 'supporter_user_id'
    ) THEN
        ALTER TABLE contributions 
        ADD COLUMN supporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
        
        -- Add index for better query performance
        CREATE INDEX IF NOT EXISTS idx_contributions_supporter_user_id 
        ON contributions(supporter_user_id);
        
        RAISE NOTICE 'Added supporter_user_id column to contributions table';
    ELSE
        RAISE NOTICE 'supporter_user_id column already exists in contributions table';
    END IF;
END $$;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN contributions.supporter_user_id IS 'Reference to the user who made this contribution. Used to track contributions made by authenticated users.';
