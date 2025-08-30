-- Clean up duplicate RLS policies and tighten security

-- Drop duplicate demo_leads policies (keeping the more specific ones)
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.demo_leads;

-- Improve demo_leads security by adding rate limiting consideration
-- (Note: The existing policies are actually reasonable for lead capture)

-- Add better constraints to prevent abuse
ALTER TABLE public.demo_leads 
ADD CONSTRAINT demo_leads_email_format_check 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add constraint to prevent extremely long submissions that could be used for attacks
ALTER TABLE public.demo_leads 
ADD CONSTRAINT demo_leads_name_length_check 
CHECK (length(name) <= 100);

ALTER TABLE public.demo_leads 
ADD CONSTRAINT demo_leads_additional_info_length_check 
CHECK (length(additional_info) <= 1000);

-- Ensure sahm_budget_submissions has reasonable limits
ALTER TABLE public.sahm_budget_submissions 
ADD CONSTRAINT sahm_budget_name_length_check 
CHECK (length(name) <= 100);

ALTER TABLE public.sahm_budget_submissions 
ADD CONSTRAINT sahm_budget_notes_length_check 
CHECK (length(notes) <= 2000);

-- Add email format validation to sahm_budget_submissions
ALTER TABLE public.sahm_budget_submissions 
ADD CONSTRAINT sahm_budget_email_format_check 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');