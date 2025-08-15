-- Create table for SAHM budget submissions
CREATE TABLE public.sahm_budget_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  location TEXT,
  household_size INTEGER,
  dependents INTEGER,
  needs_data JSONB NOT NULL DEFAULT '{}',
  wants_data JSONB NOT NULL DEFAULT '{}',
  savings_data JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  total_needs NUMERIC DEFAULT 0,
  total_wants NUMERIC DEFAULT 0,
  total_savings NUMERIC DEFAULT 0,
  total_budget NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address INET
);

-- Enable Row Level Security
ALTER TABLE public.sahm_budget_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert SAHM budget submissions
CREATE POLICY "Anyone can insert SAHM budget submissions" 
ON public.sahm_budget_submissions 
FOR INSERT 
WITH CHECK (true);

-- Only service role can view all submissions (for analytics)
CREATE POLICY "Service role can view all SAHM budget submissions" 
ON public.sahm_budget_submissions 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Users can view their own submissions by email
CREATE POLICY "Users can view their own SAHM budget submissions" 
ON public.sahm_budget_submissions 
FOR SELECT 
USING (email = (auth.jwt() ->> 'email'));

-- Create index for efficient querying
CREATE INDEX idx_sahm_budget_submissions_email ON public.sahm_budget_submissions(email);
CREATE INDEX idx_sahm_budget_submissions_created_at ON public.sahm_budget_submissions(created_at);
CREATE INDEX idx_sahm_budget_submissions_total_budget ON public.sahm_budget_submissions(total_budget);