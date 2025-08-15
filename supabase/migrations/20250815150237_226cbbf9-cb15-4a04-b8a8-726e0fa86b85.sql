-- Add missing additional_info column to sahm_budget_submissions table
ALTER TABLE public.sahm_budget_submissions 
ADD COLUMN IF NOT EXISTS additional_info jsonb DEFAULT NULL;