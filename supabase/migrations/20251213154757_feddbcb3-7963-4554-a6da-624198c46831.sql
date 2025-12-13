-- Drop the old constraint
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_employment_type_check;

-- Add the updated constraint with 'contract' included
ALTER TABLE employees ADD CONSTRAINT employees_employment_type_check 
CHECK (employment_type = ANY (ARRAY['hourly', 'monthly', 'daily', 'weekly', 'shift_based', 'contract']));