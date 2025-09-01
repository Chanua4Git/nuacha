-- Seed comprehensive categories for existing users
SELECT public.ensure_user_budget_categories_safe('51ea8fe1-73f4-4573-9e49-8f6a2de58672'::uuid);
SELECT public.ensure_user_budget_categories_safe('27182ba6-fe5d-431e-9302-c0c7e71597c0'::uuid);

-- Clean up any duplicates
SELECT public.cleanup_duplicate_budget_categories();

-- Reclassify to ensure "Dining out" is properly categorized as 'wants'
SELECT public.reclassify_categories();

-- Map existing expenses to budget categories
SELECT public.map_all_expenses_to_budget_categories();