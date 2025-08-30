-- Add phone column and source tracking to demo_leads table
ALTER TABLE public.demo_leads 
ADD COLUMN phone text,
ADD COLUMN source text DEFAULT 'unknown',
ADD COLUMN user_agent text,
ADD COLUMN ip_address inet;