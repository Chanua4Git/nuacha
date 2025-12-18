-- Add TTD/USD columns to subscription_orders for storage-based pricing
ALTER TABLE public.subscription_orders 
ADD COLUMN IF NOT EXISTS amount_ttd NUMERIC,
ADD COLUMN IF NOT EXISTS amount_usd NUMERIC,
ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER;

-- Update currency default to TTD
ALTER TABLE public.subscription_orders 
ALTER COLUMN currency SET DEFAULT 'TTD';

-- Add comment for clarity
COMMENT ON COLUMN public.subscription_orders.amount_ttd IS 'Amount in Trinidad & Tobago Dollars';
COMMENT ON COLUMN public.subscription_orders.amount_usd IS 'Equivalent amount in US Dollars';
COMMENT ON COLUMN public.subscription_orders.storage_limit_mb IS 'Storage allocation in MB for this subscription';