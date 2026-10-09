CREATE TABLE public.review_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL,
  ref_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, ref_id)
);
GRANT SELECT, INSERT, DELETE ON public.review_marks TO authenticated;
GRANT ALL ON public.review_marks TO service_role;
ALTER TABLE public.review_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own review marks" ON public.review_marks FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());