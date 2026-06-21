CREATE TABLE public.payslips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  phone_sent_to TEXT,
  period_start DATE,
  period_end DATE,
  entry_ids UUID[] NOT NULL DEFAULT '{}',
  days_total NUMERIC NOT NULL DEFAULT 0,
  gross_total NUMERIC NOT NULL DEFAULT 0,
  nis_employee_total NUMERIC NOT NULL DEFAULT 0,
  net_total NUMERIC NOT NULL DEFAULT 0,
  payslip_text TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payslips_user_employee ON public.payslips(user_id, employee_id);
CREATE INDEX idx_payslips_period ON public.payslips(period_start, period_end);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payslips TO authenticated;
GRANT ALL ON public.payslips TO service_role;

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own payslips"
ON public.payslips
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_payslips_updated_at
BEFORE UPDATE ON public.payslips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();