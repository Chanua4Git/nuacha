-- Replace overly-restrictive unique constraint that blocked weekly entries
ALTER TABLE public.payroll_entries
  DROP CONSTRAINT IF EXISTS payroll_entries_payroll_period_id_employee_id_key;

ALTER TABLE public.payroll_entries
  ADD CONSTRAINT payroll_entries_period_emp_week_key
  UNIQUE (payroll_period_id, employee_id, week_number);

-- Cleanup of broken bulk-imported periods (entries cascade)
DELETE FROM public.payroll_periods
WHERE import_source LIKE 'xlsx_import_%';