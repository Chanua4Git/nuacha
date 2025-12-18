-- Ensure new subscription orders are linked to the currently authenticated user when available
ALTER TABLE public.subscription_orders
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Recreate policies with explicit roles to avoid role-mismatch (anon vs authenticated)
DROP POLICY IF EXISTS "Anyone can create subscription orders" ON public.subscription_orders;
CREATE POLICY "Anyone can create subscription orders"
ON public.subscription_orders
FOR INSERT
TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own subscription orders" ON public.subscription_orders;
CREATE POLICY "Users can view their own subscription orders"
ON public.subscription_orders
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id)
  OR (customer_email = (auth.jwt() ->> 'email'))
  OR has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow authenticated users to create orders linked to their user_id
DROP POLICY IF EXISTS "Authenticated users can create subscription orders" ON public.subscription_orders;
CREATE POLICY "Authenticated users can create subscription orders"
ON public.subscription_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
