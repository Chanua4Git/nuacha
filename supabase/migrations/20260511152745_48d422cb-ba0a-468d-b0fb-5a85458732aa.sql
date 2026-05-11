
ALTER TABLE public.payroll_periods 
  ADD COLUMN IF NOT EXISTS import_source TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_payroll_periods_user_start 
  ON public.payroll_periods (user_id, start_date);

CREATE INDEX IF NOT EXISTS idx_payroll_entries_employee_week 
  ON public.payroll_entries (employee_id, week_start_date);
