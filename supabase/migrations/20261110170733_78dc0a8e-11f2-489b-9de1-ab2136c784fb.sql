CREATE TABLE public.shopping_list_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  list_name text NOT NULL DEFAULT 'Household',
  name text NOT NULL,
  store text,
  notes text,
  is_checked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_list_items TO authenticated;
GRANT ALL ON public.shopping_list_items TO service_role;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own shopping items" ON public.shopping_list_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER shopping_list_items_updated BEFORE UPDATE ON public.shopping_list_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();