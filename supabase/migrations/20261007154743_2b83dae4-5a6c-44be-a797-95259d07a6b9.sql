CREATE TABLE public.nudge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stage text NOT NULL DEFAULT 'manual',
  channel text NOT NULL DEFAULT 'both',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nudge_templates TO authenticated;
GRANT ALL ON public.nudge_templates TO service_role;
ALTER TABLE public.nudge_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage nudge templates" ON public.nudge_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.admin_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  template_id uuid REFERENCES public.nudge_templates(id) ON DELETE SET NULL,
  channel text NOT NULL,
  message text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_comm_target ON public.admin_communications(target_user_id, sent_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_communications TO authenticated;
GRANT ALL ON public.admin_communications TO service_role;
ALTER TABLE public.admin_communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage communications" ON public.admin_communications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin') AND admin_id = auth.uid());

CREATE OR REPLACE FUNCTION public.admin_user_journeys()
RETURNS TABLE(user_id uuid, email text, phone text, provider text, joined_at timestamptz, last_sign_in_at timestamptz,
  family_count int, total_scans int, scans_today int, best_day_scans int, expense_count int,
  last_nudge_at timestamptz, nudge_count int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT u.id, u.email::text,
    COALESCE(NULLIF(p.phone_number,''), NULLIF(u.raw_user_meta_data->>'phone_number',''), NULLIF(u.phone,''))::text,
    COALESCE(u.raw_app_meta_data->>'provider','email')::text,
    u.created_at, u.last_sign_in_at,
    (SELECT count(*)::int FROM families f WHERE f.user_id = u.id),
    (SELECT COALESCE(sum(s.scan_count),0)::int FROM scan_usage s WHERE s.user_id = u.id OR lower(s.email) = lower(u.email)),
    (SELECT COALESCE(sum(s.scan_count),0)::int FROM scan_usage s WHERE (s.user_id = u.id OR lower(s.email) = lower(u.email)) AND s.scan_date = (now() AT TIME ZONE 'America/Port_of_Spain')::date),
    (SELECT COALESCE(max(d.c),0)::int FROM (SELECT sum(s.scan_count) c FROM scan_usage s WHERE s.user_id = u.id OR lower(s.email) = lower(u.email) GROUP BY s.scan_date) d),
    (SELECT count(*)::int FROM expenses e JOIN families f ON f.id = e.family_id WHERE f.user_id = u.id),
    (SELECT max(c.sent_at) FROM admin_communications c WHERE c.target_user_id = u.id),
    (SELECT count(*)::int FROM admin_communications c WHERE c.target_user_id = u.id)
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_user_journeys() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_user_journeys() TO authenticated;

INSERT INTO public.nudge_templates (name, stage, channel, message) VALUES
('Add your WhatsApp', 'needs_phone', 'email', 'Hi [Name]! Thank you for joining Nuacha 🌿 Could you add your WhatsApp number in the app? It lets me gently help if you get stuck. nuacha.com'),
('Set up your household', 'no_household', 'both', 'Hi [Name]! So glad you signed up for Nuacha 🌿 The next small step is setting up your household — it takes 30 seconds. nuacha.com/app'),
('First scan', 'no_scan', 'both', 'Hi [Name]! Have a receipt from today? Snap it in Nuacha and watch it sort itself out ✨ One photo is all it takes. nuacha.com'),
('Three scans today', 'under_three', 'both', 'Hi [Name]! You''ve done [X] of your 3 free scans today 🙌 Got two more receipts lying around? They reset every day. nuacha.com'),
('Gentle check-in', 're_engagement', 'both', 'Hi [Name]! Just checking in 🌿 No pressure at all — whenever you''re ready, one snap a night keeps things calm. Anything I can help with? nuacha.com');