-- Grant INSERT permission to allow anyone to create subscription orders (checkout flow)
GRANT INSERT ON public.subscription_orders TO anon;
GRANT INSERT ON public.subscription_orders TO authenticated;

-- Grant SELECT permission for users to view their own orders
GRANT SELECT ON public.subscription_orders TO anon;
GRANT SELECT ON public.subscription_orders TO authenticated;

-- Grant full access to service_role for admin operations
GRANT ALL ON public.subscription_orders TO service_role;