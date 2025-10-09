-- Add amount_paid column to claims table to track partial/full payments
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN claims.amount_paid IS 'Total amount paid by the spender towards this claim';

-- Update existing claims to have 0 as default if NULL
UPDATE claims SET amount_paid = 0 WHERE amount_paid IS NULL;
