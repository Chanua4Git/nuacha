
-- 1) Add columns to expenses for payroll linking and paid date (aligned to existing naming conventions)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS paid_on_date text,
  ADD COLUMN IF NOT EXISTS payroll_period_id uuid,
  ADD COLUMN IF NOT EXISTS payroll_entry_id uuid;

-- 2) Add foreign keys (idempotent-safe with exception handling)
DO $$
BEGIN
  ALTER TABLE public.expenses
    ADD CONSTRAINT expenses_payroll_period_id_fkey
    FOREIGN KEY (payroll_period_id)
    REFERENCES public.payroll_periods (id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.expenses
    ADD CONSTRAINT expenses_payroll_entry_id_fkey
    FOREIGN KEY (payroll_entry_id)
    REFERENCES public.payroll_entries (id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_expenses_payroll_period_id ON public.expenses (payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payroll_entry_id ON public.expenses (payroll_entry_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_on_date ON public.expenses (paid_on_date);
