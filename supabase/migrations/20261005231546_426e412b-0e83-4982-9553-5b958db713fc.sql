CREATE TABLE public.business_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'garden_ohm',
  external_order_id text NOT NULL,
  order_number text,
  customer_name text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TTD',
  payment_method_raw text,
  channel text NOT NULL DEFAULT 'unknown',
  channel_locked boolean NOT NULL DEFAULT false,
  account_id uuid REFERENCES public.money_accounts(id) ON DELETE SET NULL,
  delivered_on date,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_order_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_income TO authenticated;
GRANT ALL ON public.business_income TO service_role;
ALTER TABLE public.business_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their business income" ON public.business_income
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX business_income_user_date ON public.business_income(user_id, delivered_on);
CREATE TRIGGER update_business_income_updated_at BEFORE UPDATE ON public.business_income
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();