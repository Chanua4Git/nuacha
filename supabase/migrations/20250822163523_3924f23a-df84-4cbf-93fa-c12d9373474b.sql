-- Clean up corrupted categories where name contains UUIDs
DELETE FROM public.categories 
WHERE name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Update any expenses that reference corrupted categories to use first available category
UPDATE public.expenses 
SET category = (
  SELECT c.name 
  FROM public.categories c 
  JOIN public.families f ON f.id = expenses.family_id
  WHERE c.family_id = f.id OR (c.family_id IS NULL AND c.user_id = f.user_id)
  ORDER BY c.created_at ASC 
  LIMIT 1
)::text
WHERE category ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Add constraint to prevent UUID names in the future
ALTER TABLE public.categories 
ADD CONSTRAINT categories_name_not_uuid_check 
CHECK (name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');