CREATE TABLE public.nis_remittances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_month DATE NOT NULL,
  total_nis NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_on_date DATE,
  nib_transaction_code TEXT,
  ni184_submitted BOOLEAN NOT NULL DEFAULT false,
  ni184_submitted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, employee_id, period_month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nis_remittances TO authenticated;
GRANT ALL ON public.nis_remittances TO service_role;

ALTER TABLE public.nis_remittances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own nis remittances"
  ON public.nis_remittances FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_nis_remittances_updated_at
  BEFORE UPDATE ON public.nis_remittances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_nis_remittances_emp_month ON public.nis_remittances(employee_id, period_month);