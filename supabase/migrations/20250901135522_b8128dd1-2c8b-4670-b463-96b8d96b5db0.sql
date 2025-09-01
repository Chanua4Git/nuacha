-- First, ensure user has comprehensive budget categories
SELECT public.ensure_user_budget_categories_safe('f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid);

-- Clean up any duplicates that might exist
SELECT public.cleanup_duplicate_budget_categories();

-- Reclassify categories to ensure proper grouping
SELECT public.reclassify_categories();

-- Map existing expenses to budget categories
SELECT public.map_all_expenses_to_budget_categories();