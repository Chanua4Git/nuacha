-- Add missing GRANT statements for subscription_orders table
-- The RLS policies exist but roles don't have base table access

-- Grant INSERT to anon and authenticated for public checkout
GRANT INSERT ON public.subscription_orders TO anon;
GRANT INSERT ON public.subscription_orders TO authenticated;

-- Grant SELECT to authenticated users (for viewing their own orders)
GRANT SELECT ON public.subscription_orders TO authenticated;

-- Grant full access to service_role (for admin operations)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_orders TO service_role;

-- Also grant on whatsapp_templates for template viewing
GRANT SELECT ON public.whatsapp_templates TO anon;
GRANT SELECT ON public.whatsapp_templates TO authenticated;