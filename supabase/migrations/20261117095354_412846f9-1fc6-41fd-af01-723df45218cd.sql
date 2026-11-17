CREATE TABLE public.coparenting_profile (
  user_id uuid PRIMARY KEY,
  my_role text, other_role text, relationship text,
  my_country text, other_country text,
  children jsonb NOT NULL DEFAULT '[]'::jsonb,
  lives_with text, maintenance text, stage text,
  safety_concern text, start_mode text, invite_pref text,
  onboarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.coparenting_display (
  user_id uuid PRIMARY KEY,
  my_role text, other_role text,
  phases jsonb NOT NULL DEFAULT '[]'::jsonb,
  coverage jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coparenting_profile, public.coparenting_display TO authenticated;
GRANT ALL ON public.coparenting_profile, public.coparenting_display TO service_role;
ALTER TABLE public.coparenting_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coparenting_display ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages profile" ON public.coparenting_profile FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner or viewer reads display" ON public.coparenting_display FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.can_view_coparenting(user_id));
CREATE POLICY "Owner inserts display" ON public.coparenting_display FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates display" ON public.coparenting_display FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner deletes display" ON public.coparenting_display FOR DELETE TO authenticated USING (auth.uid() = user_id);