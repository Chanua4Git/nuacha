-- Add group_type to main categories table to support budget grouping
ALTER TABLE public.categories 
ADD COLUMN group_type text;

-- Add user_id column to categories to support user-specific categories
ALTER TABLE public.categories 
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Add sort_order column to categories for consistent ordering
ALTER TABLE public.categories 
ADD COLUMN sort_order integer DEFAULT 0;

-- Create index for better performance on group_type queries
CREATE INDEX idx_categories_group_type ON public.categories(group_type);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);

-- Migrate existing budget_categories to main categories table
INSERT INTO public.categories (id, name, color, group_type, family_id, created_at, budget, sort_order, user_id)
SELECT 
  bc.id,
  bc.name,
  CASE 
    WHEN bc.group_type = 'needs' THEN '#ef4444'
    WHEN bc.group_type = 'wants' THEN '#3b82f6' 
    WHEN bc.group_type = 'savings' THEN '#10b981'
    ELSE '#6b7280'
  END as color,
  bc.group_type,
  NULL as family_id, -- Budget categories are user-wide, not family-specific
  bc.created_at,
  NULL as budget,
  bc.sort_order,
  bc.user_id
FROM public.budget_categories bc
ON CONFLICT (id) DO NOTHING;

-- Update expenses to use the unified categories
-- For expenses that have budget_category_id, map them to the migrated categories
UPDATE public.expenses 
SET category = (
  SELECT name 
  FROM public.categories 
  WHERE id = expenses.budget_category_id
)
WHERE budget_category_id IS NOT NULL 
AND category IS DISTINCT FROM (
  SELECT name 
  FROM public.categories 
  WHERE id = expenses.budget_category_id
);

-- Create RLS policies for the new user_id column
DROP POLICY IF EXISTS "Users can view categories of their families" ON public.categories;
DROP POLICY IF EXISTS "Users can insert categories for their families" ON public.categories;
DROP POLICY IF EXISTS "Users can update categories of their families" ON public.categories;
DROP POLICY IF EXISTS "Users can delete categories of their families" ON public.categories;

-- New RLS policies that handle both family and user categories
CREATE POLICY "Users can view their categories" ON public.categories
FOR SELECT USING (
  (family_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM families 
    WHERE families.id = categories.family_id 
    AND families.user_id = auth.uid()
  )) 
  OR 
  (family_id IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Users can insert their categories" ON public.categories
FOR INSERT WITH CHECK (
  (family_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM families 
    WHERE families.id = categories.family_id 
    AND families.user_id = auth.uid()
  )) 
  OR 
  (family_id IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Users can update their categories" ON public.categories
FOR UPDATE USING (
  (family_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM families 
    WHERE families.id = categories.family_id 
    AND families.user_id = auth.uid()
  )) 
  OR 
  (family_id IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Users can delete their categories" ON public.categories
FOR DELETE USING (
  (family_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM families 
    WHERE families.id = categories.family_id 
    AND families.user_id = auth.uid()
  )) 
  OR 
  (family_id IS NULL AND user_id = auth.uid())
);