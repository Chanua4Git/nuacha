-- Drop the problematic FOR ALL policy that conflicts with public INSERT
DROP POLICY IF EXISTS "Admins can manage subscription orders" ON public.subscription_orders;

-- Create separate admin policies (not affecting INSERT)
CREATE POLICY "Admins can view all subscription orders"
ON public.subscription_orders
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscription orders"
ON public.subscription_orders
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subscription orders"
ON public.subscription_orders
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));