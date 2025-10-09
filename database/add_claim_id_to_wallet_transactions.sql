-- Add claim_id to wallet_transactions to properly link payments to claims
ALTER TABLE wallet_transactions 
ADD COLUMN IF NOT EXISTS claim_id UUID REFERENCES claims(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_claim_id ON wallet_transactions(claim_id);

-- Add comment
COMMENT ON COLUMN wallet_transactions.claim_id IS 'Links this transaction to a specific claim (for spender list payments)';

