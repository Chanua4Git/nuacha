
-- Ensure Row Level Security is enabled
ALTER TABLE public.demo_leads ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies that might conflict
DROP POLICY IF EXISTS "Anyone can insert demo leads" ON public.demo_leads;
DROP POLICY IF EXISTS "Users can view their own demo leads" ON public.demo_leads;
DROP POLICY IF EXISTS "Service role can read demo leads" ON public.demo_leads;
DROP POLICY IF EXISTS "Service role can read all leads" ON public.demo_leads;

-- Allow anyone (anon and authenticated) to insert demo leads
CREATE POLICY "Public can insert demo leads"
  ON public.demo_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to view their own demo leads by email
-- This supports return=representation for signed-in users only.
CREATE POLICY "Users can view their own demo leads"
  ON public.demo_leads
  FOR SELECT
  TO authenticated
  USING (email = (auth.jwt() ->> 'email'));
