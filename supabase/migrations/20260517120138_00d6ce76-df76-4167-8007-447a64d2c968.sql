ALTER TABLE public.payroll_entries
  ADD COLUMN IF NOT EXISTS entry_date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS paid_on_date date;

UPDATE public.payroll_entries
SET entry_date = COALESCE(calculated_at::date, created_at::date, CURRENT_DATE)
WHERE entry_date = CURRENT_DATE
  AND (calculated_at IS NOT NULL OR created_at IS NOT NULL);