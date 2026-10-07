CREATE TABLE public.learning_progress (
  user_id uuid NOT NULL,
  module_id text NOT NULL,
  steps_completed text[] NOT NULL DEFAULT '{}',
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, module_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_progress TO authenticated;
GRANT ALL ON public.learning_progress TO service_role;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own learning progress" ON public.learning_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read learning progress" ON public.learning_progress FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER learning_progress_updated BEFORE UPDATE ON public.learning_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.admin_learning_overview()
RETURNS TABLE(user_id uuid, completed_modules text[], last_module text, last_learning_at timestamptz, open_questions jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY
  SELECT u.id,
    COALESCE((SELECT array_agg(lp.module_id) FROM learning_progress lp WHERE lp.user_id = u.id AND lp.completed), '{}'),
    (SELECT lp.module_id FROM learning_progress lp WHERE lp.user_id = u.id ORDER BY lp.updated_at DESC LIMIT 1),
    (SELECT max(lp.updated_at) FROM learning_progress lp WHERE lp.user_id = u.id),
    COALESCE((SELECT jsonb_agg(jsonb_build_object('module', f.metadata->>'module_id', 'message', f.message, 'at', f.created_at) ORDER BY f.created_at DESC)
      FROM user_feedback f WHERE f.user_id = u.id AND f.category = 'learning' AND f.admin_response IS NULL), '[]'::jsonb)
  FROM auth.users u;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_learning_overview() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_learning_overview() TO authenticated;