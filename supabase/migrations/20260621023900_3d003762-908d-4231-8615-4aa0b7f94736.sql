ALTER TABLE public.payroll_entries
  ADD COLUMN IF NOT EXISTS regular_days numeric,
  ADD COLUMN IF NOT EXISTS holiday_days numeric,
  ADD COLUMN IF NOT EXISTS holiday_multiplier numeric;