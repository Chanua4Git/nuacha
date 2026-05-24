ALTER TABLE public.payroll_entries ALTER COLUMN week_start_date SET NOT NULL;
DROP INDEX IF EXISTS public.payroll_entries_period_employee_week_start_key;
ALTER TABLE public.payroll_entries
  ADD CONSTRAINT payroll_entries_period_employee_week_start_key
  UNIQUE (payroll_period_id, employee_id, week_start_date);