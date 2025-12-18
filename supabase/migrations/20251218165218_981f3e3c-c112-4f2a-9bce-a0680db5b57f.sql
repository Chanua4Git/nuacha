-- Drop the old constraint
ALTER TABLE public.subscription_orders 
DROP CONSTRAINT IF EXISTS subscription_orders_plan_type_check;

-- Create new constraint with ALL valid plan types (old + new names)
ALTER TABLE public.subscription_orders 
ADD CONSTRAINT subscription_orders_plan_type_check 
CHECK (plan_type = ANY (ARRAY[
  -- New plan names (current)
  'getting_tidy'::text, 
  'staying_organized'::text, 
  'fully_streamlined'::text,
  -- Legacy plan names (backward compatibility)
  'families'::text, 
  'business'::text, 
  'entrepreneurs'::text
]));