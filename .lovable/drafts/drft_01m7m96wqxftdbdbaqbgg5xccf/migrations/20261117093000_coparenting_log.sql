-- Private co-parenting log: entries, call check-ins, owner-only private details, read-only viewers by email.
CREATE TABLE public.coparenting_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_date date NOT NULL,
  date_label text,
  date_precision text NOT NULL DEFAULT 'exact',
  phase text,
  category text NOT NULL,
  title text NOT NULL,
  details text,
  initiated_by text,
  channel text,
  child_effect text,
  my_response text,
  status text NOT NULL DEFAULT 'My account',
  amount numeric,
  expense_id uuid,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.coparenting_private (
  entry_id uuid PRIMARY KEY REFERENCES public.coparenting_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  details text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.coparenting_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  call_date date NOT NULL,
  scheduled boolean NOT NULL DEFAULT true,
  outcome text NOT NULL DEFAULT 'happened',
  made_by text,
  duration_min integer,
  child_mood text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, call_date)
);
CREATE TABLE public.coparenting_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  viewer_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, viewer_email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coparenting_entries, public.coparenting_private, public.coparenting_calls, public.coparenting_viewers TO authenticated;
GRANT ALL ON public.coparenting_entries, public.coparenting_private, public.coparenting_calls, public.coparenting_viewers TO service_role;
ALTER TABLE public.coparenting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coparenting_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coparenting_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coparenting_viewers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_view_coparenting(_owner uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.coparenting_viewers v
    WHERE v.owner_id = _owner AND lower(v.viewer_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
$$;

CREATE POLICY "Owner manages entries" ON public.coparenting_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Viewers read entries" ON public.coparenting_entries FOR SELECT TO authenticated USING (archived_at IS NULL AND public.can_view_coparenting(user_id));
CREATE POLICY "Owner manages private details" ON public.coparenting_private FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner manages calls" ON public.coparenting_calls FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Viewers read calls" ON public.coparenting_calls FOR SELECT TO authenticated USING (public.can_view_coparenting(user_id));
CREATE POLICY "Owner manages viewers" ON public.coparenting_viewers FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Viewer sees own invite" ON public.coparenting_viewers FOR SELECT TO authenticated USING (lower(viewer_email) = lower(coalesce(auth.jwt() ->> 'email', '')));
CREATE INDEX coparenting_entries_user_date ON public.coparenting_entries (user_id, event_date);
