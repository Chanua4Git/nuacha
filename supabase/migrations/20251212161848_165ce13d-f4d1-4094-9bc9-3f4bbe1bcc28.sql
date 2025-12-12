-- Drop the existing constraint that only allows hourly, monthly, daily
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_employment_type_check;

-- Add new constraint that includes weekly and shift_based
ALTER TABLE public.employees ADD CONSTRAINT employees_employment_type_check 
  CHECK (employment_type = ANY (ARRAY['hourly', 'monthly', 'daily', 'weekly', 'shift_based']));