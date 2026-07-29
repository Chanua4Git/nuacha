ALTER TABLE public.payroll_entries
ADD COLUMN IF NOT EXISTS pay_day_date date;