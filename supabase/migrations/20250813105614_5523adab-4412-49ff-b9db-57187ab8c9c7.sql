-- Phase 2: Clean up old budget_categories table after successful migration
-- This removes the old table since we've unified everything into the categories table

-- Drop the old budget_categories table (data has been migrated to categories table)
DROP TABLE IF EXISTS public.budget_categories CASCADE;