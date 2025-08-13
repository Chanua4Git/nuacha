-- Phase 1: Update family-level categories with group_type to be budget categories
UPDATE public.categories 
SET is_budget_category = true 
WHERE family_id IS NOT NULL 
  AND group_type IS NOT NULL 
  AND is_budget_category = false;

-- Phase 2: Remove duplicate user-level budget categories that overlap with family-level categories
-- First, identify and delete user-level budget categories that have the same name as family-level categories
DELETE FROM public.categories c1
WHERE c1.family_id IS NULL 
  AND c1.user_id IS NOT NULL 
  AND c1.is_budget_category = true
  AND EXISTS (
    SELECT 1 FROM public.categories c2
    WHERE c2.family_id IS NOT NULL
      AND c2.name = c1.name
      AND c2.group_type IS NOT NULL
      AND c2.is_budget_category = true
  );

-- Ensure all family-level categories with group_type are properly set as budget categories
UPDATE public.categories 
SET is_budget_category = true,
    sort_order = COALESCE(sort_order, 0)
WHERE family_id IS NOT NULL 
  AND group_type IN ('needs', 'wants', 'savings');