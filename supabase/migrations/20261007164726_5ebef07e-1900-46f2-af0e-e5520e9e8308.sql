ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_note text;
CREATE POLICY "Admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.setup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  whatsapp text NOT NULL,
  email text,
  package text NOT NULL,
  amount_ttd numeric NOT NULL,
  mode text NOT NULL,
  payment_method text NOT NULL,
  reference text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.setup_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.setup_requests TO authenticated;
GRANT ALL ON public.setup_requests TO service_role;
ALTER TABLE public.setup_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request setup" ON public.setup_requests FOR INSERT TO anon, authenticated
  WITH CHECK (length(name) BETWEEN 1 AND 120 AND length(whatsapp) BETWEEN 5 AND 30 AND coalesce(length(email),0) <= 200
    AND package IN ('hand_holding','done_for_you') AND mode IN ('remote','in_person')
    AND payment_method IN ('wipay','pwyw','bank') AND status = 'new' AND coalesce(length(notes),0) <= 1000
    AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "Admins read setup" ON public.setup_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update setup" ON public.setup_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER setup_requests_updated BEFORE UPDATE ON public.setup_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));