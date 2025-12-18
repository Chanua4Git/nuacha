-- Fix RLS INSERT policy role assignment for public checkout flow
-- The existing policy was created with TO anon, authenticated; recreate it with TO public.

DROP POLICY IF EXISTS "Anyone can create subscription orders" ON public.subscription_orders;

CREATE POLICY "Anyone can create subscription orders"
ON public.subscription_orders
FOR INSERT
TO public
WITH CHECK (true);
