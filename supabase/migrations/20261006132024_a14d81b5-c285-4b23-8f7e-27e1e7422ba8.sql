CREATE TABLE public.paid_from_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,            -- 'employee' | 'category' | 'place'
  match_key text NOT NULL,       -- employee id, category id, or lower-case place text
  label text NOT NULL,
  account_id uuid REFERENCES public.money_accounts(id) ON DELETE SET NULL,
  monthly_estimate numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, match_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paid_from_defaults TO authenticated;
GRANT ALL ON public.paid_from_defaults TO service_role;
ALTER TABLE public.paid_from_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their paid-from defaults" ON public.paid_from_defaults
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_paid_from_defaults_updated_at BEFORE UPDATE ON public.paid_from_defaults
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();