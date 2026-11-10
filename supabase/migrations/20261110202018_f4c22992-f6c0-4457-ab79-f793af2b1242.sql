CREATE TABLE public.shopping_price_sightings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_name text NOT NULL,
  store text NOT NULL,
  price numeric NOT NULL,
  seen_on date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_price_sightings TO authenticated;
GRANT ALL ON public.shopping_price_sightings TO service_role;
ALTER TABLE public.shopping_price_sightings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage price sightings" ON public.shopping_price_sightings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);