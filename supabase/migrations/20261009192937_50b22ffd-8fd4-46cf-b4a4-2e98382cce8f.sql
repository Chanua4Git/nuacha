DROP FUNCTION IF EXISTS public.admin_user_journeys();
CREATE OR REPLACE FUNCTION public.admin_user_journeys()
RETURNS TABLE(user_id uuid, email text, phone text, provider text, joined_at timestamptz, last_sign_in_at timestamptz,
  family_count int, total_scans int, scans_today int, best_day_scans int, expense_count int,
  last_nudge_at timestamptz, nudge_count int, persons_count int, has_budget boolean)
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
    (SELECT count(*)::int FROM admin_communications c WHERE c.target_user_id = u.id),
    (SELECT count(*)::int FROM family_members fm JOIN families f ON f.id = fm.family_id WHERE f.user_id = u.id),
    (EXISTS (SELECT 1 FROM budgets b JOIN families f ON f.id = b.family_id WHERE f.user_id = u.id)
     OR EXISTS (SELECT 1 FROM budget_allocations ba WHERE ba.user_id = u.id)
     OR EXISTS (SELECT 1 FROM budget_templates bt WHERE bt.user_id = u.id))
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_user_journeys() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_user_journeys() TO authenticated;

INSERT INTO public.nudge_templates (name, stage, channel, message) VALUES
('Add your people & budget', 'no_persons', 'both', 'Hi [Name]! Lovely to have you in Nuacha 🌿 Two gentle next steps when you''re ready: add the people in your household so expenses can be tagged to them (nuacha.com/app), and set a soft monthly budget so you can see where things flow (nuacha.com/budget). No pressure — and if you''d like me to walk you through it, I offer setup sessions here: nuacha.com/setup 💛'),
('Set a gentle budget', 'no_budget', 'both', 'Hi [Name]! Your household is taking shape 🌿 One small next step: set a gentle monthly budget so Nuacha can show you where money flows — it takes a couple of minutes: nuacha.com/budget. And if you''d like a hand, I''m here: nuacha.com/setup 💛');