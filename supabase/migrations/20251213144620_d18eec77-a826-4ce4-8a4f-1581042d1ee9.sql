-- Force refresh: drop and recreate the INSERT policy with explicit role targeting
DROP POLICY IF EXISTS "Anyone can create subscription orders" ON public.subscription_orders;

CREATE POLICY "Anyone can create subscription orders"
ON public.subscription_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);