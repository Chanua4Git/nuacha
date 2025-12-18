-- Grant INSERT to both anon and authenticated for public checkout
-- (Users can start purchase flow before or after signing in)
GRANT INSERT ON public.subscription_orders TO anon;
GRANT INSERT ON public.subscription_orders TO authenticated;

-- Grant SELECT to authenticated users (to view their own orders)
-- RLS policy restricts to own orders + admin
GRANT SELECT ON public.subscription_orders TO authenticated;

-- Grant UPDATE to authenticated (for admin payment confirmation)
-- RLS policy restricts to admin only
GRANT UPDATE ON public.subscription_orders TO authenticated;

-- Grant DELETE to authenticated (for admin cleanup)
-- RLS policy restricts to admin only  
GRANT DELETE ON public.subscription_orders TO authenticated;

-- Full access for service_role (server-side operations)
GRANT ALL ON public.subscription_orders TO service_role;