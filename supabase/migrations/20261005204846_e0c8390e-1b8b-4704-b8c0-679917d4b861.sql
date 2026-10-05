CREATE TABLE public.money_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  family_id uuid REFERENCES public.families(id) ON DELETE SET NULL,
  name text NOT NULL,
  account_last4 text,
  income_source_id uuid REFERENCES public.income_sources(id) ON DELETE SET NULL,
  monthly_income numeric NOT NULL DEFAULT 0,
  known_balance numeric,
  known_balance_date date,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.money_accounts TO authenticated;
GRANT ALL ON public.money_accounts TO service_role;
ALTER TABLE public.money_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own money accounts" ON public.money_accounts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.cash_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.money_accounts(id) ON DELETE CASCADE,
  withdrawn_on date NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric,
  has_slip boolean NOT NULL DEFAULT false,
  purpose text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_withdrawals TO authenticated;
GRANT ALL ON public.cash_withdrawals TO service_role;
ALTER TABLE public.cash_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own withdrawals" ON public.cash_withdrawals FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.money_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.money_accounts(id) ON DELETE CASCADE,
  withdrawal_id uuid REFERENCES public.cash_withdrawals(id) ON DELETE SET NULL,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE CASCADE,
  payroll_entry_id uuid REFERENCES public.payroll_entries(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.money_allocations TO authenticated;
GRANT ALL ON public.money_allocations TO service_role;
ALTER TABLE public.money_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own money links" ON public.money_allocations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_cash_withdrawals_account ON public.cash_withdrawals(account_id, withdrawn_on);
CREATE INDEX idx_money_allocations_account ON public.money_allocations(account_id);
CREATE INDEX idx_money_allocations_withdrawal ON public.money_allocations(withdrawal_id);

CREATE TRIGGER update_money_accounts_updated_at BEFORE UPDATE ON public.money_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cash_withdrawals_updated_at BEFORE UPDATE ON public.cash_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();