CREATE TABLE public.tutorial_reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutorial_reels TO authenticated;
GRANT ALL ON public.tutorial_reels TO service_role;
ALTER TABLE public.tutorial_reels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tutorial reels" ON public.tutorial_reels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tutorial_reels_updated BEFORE UPDATE ON public.tutorial_reels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Admins read reel images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tutorial-reels' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload reel images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tutorial-reels' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete reel images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tutorial-reels' AND public.has_role(auth.uid(), 'admin'));