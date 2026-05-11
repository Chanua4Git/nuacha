-- Allow upsert per (period, employee, week) so we can save individual weeks idempotently.
-- First, dedupe any existing duplicates by keeping the most recently updated row.
DELETE FROM public.payroll_entries pe
USING public.payroll_entries pe2
WHERE pe.payroll_period_id = pe2.payroll_period_id
  AND pe.employee_id = pe2.employee_id
  AND pe.week_number IS NOT NULL
  AND pe2.week_number IS NOT NULL
  AND pe.week_number = pe2.week_number
  AND pe.id < pe2.id;

CREATE UNIQUE INDEX IF NOT EXISTS payroll_entries_period_employee_week_uidx
  ON public.payroll_entries (payroll_period_id, employee_id, week_number)
  WHERE week_number IS NOT NULL;