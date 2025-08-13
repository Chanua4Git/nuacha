-- Clean up duplicate categories - find and remove user-level "Household Operations" that duplicates family-level one
DELETE FROM public.categories c1
WHERE c1.name = 'Household Operations' 
  AND c1.family_id IS NULL 
  AND c1.user_id IS NOT NULL 
  AND c1.is_budget_category = false
  AND EXISTS (
    SELECT 1 FROM public.categories c2
    WHERE c2.name = 'Household Operations'
      AND c2.family_id IS NOT NULL
      AND c2.is_budget_category = true
      AND c2.group_type = 'needs'
  );

-- Ensure family-level "Household Operations" category is properly configured
UPDATE public.categories 
SET is_budget_category = true,
    group_type = 'needs',
    sort_order = COALESCE(sort_order, 0)
WHERE name = 'Household Operations' 
  AND family_id IS NOT NULL;