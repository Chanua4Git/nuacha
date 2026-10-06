CREATE TABLE public.account_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_account_id uuid NOT NULL REFERENCES public.money_accounts(id) ON DELETE CASCADE,
  to_account_id uuid NOT NULL REFERENCES public.money_accounts(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  transferred_on date NOT NULL DEFAULT current_date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_transfers TO authenticated;
GRANT ALL ON public.account_transfers TO service_role;
ALTER TABLE public.account_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their transfers" ON public.account_transfers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_account_transfers_updated_at BEFORE UPDATE ON public.account_transfers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.money_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  kind text NOT NULL,              -- withdrawal | transfer | bill
  frequency text NOT NULL DEFAULT 'monthly', -- weekly | monthly | bimonthly
  from_account_id uuid REFERENCES public.money_accounts(id) ON DELETE SET NULL,
  to_account_id uuid REFERENCES public.money_accounts(id) ON DELETE SET NULL,
  amount_estimate numeric,
  prompt text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.money_routines TO authenticated;
GRANT ALL ON public.money_routines TO service_role;
ALTER TABLE public.money_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their routines" ON public.money_routines FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_money_routines_updated_at BEFORE UPDATE ON public.money_routines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS nurse_role text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS pays_in_cash boolean NOT NULL DEFAULT false;
ALTER TABLE public.money_accounts ADD COLUMN IF NOT EXISTS purpose text;