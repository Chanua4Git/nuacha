
-- 1) Replace cleanup function to be CASE-INSENSITIVE and fix references
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_categories_advanced()
RETURNS TABLE(duplicates_removed integer, categories_updated integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  duplicate_rec RECORD;
  keep_category_id UUID;
  total_removed INTEGER := 0;
  total_updated INTEGER := 0;
BEGIN
  -- Clean up user-level BUDGET category duplicates (family_id IS NULL) case-insensitively
  FOR duplicate_rec IN 
    SELECT 
      user_id, 
      LOWER(name) AS name_lc, 
      COALESCE(group_type, '') AS group_type_norm,
      ARRAY_AGG(id ORDER BY created_at) AS category_ids
    FROM public.categories 
    WHERE family_id IS NULL 
      AND is_budget_category = TRUE
    GROUP BY user_id, LOWER(name), COALESCE(group_type, '')
    HAVING COUNT(*) > 1
  LOOP
    keep_category_id := duplicate_rec.category_ids[1];
    
    -- Update all references to point to the kept category
    FOR i IN 2..array_length(duplicate_rec.category_ids, 1) LOOP
      -- Update expenses that reference the duplicate budget category
      UPDATE public.expenses 
      SET budget_category_id = keep_category_id 
      WHERE budget_category_id = duplicate_rec.category_ids[i];

      -- Update receipt line items that reference the duplicate category
      UPDATE public.receipt_line_items 
      SET category_id = keep_category_id 
      WHERE category_id = duplicate_rec.category_ids[i];

      UPDATE public.receipt_line_items 
      SET suggested_category_id = keep_category_id 
      WHERE suggested_category_id = duplicate_rec.category_ids[i];

      -- Update budgets that reference the duplicate category
      UPDATE public.budgets 
      SET category_id = keep_category_id 
      WHERE category_id = duplicate_rec.category_ids[i];

      -- Delete the duplicate category
      DELETE FROM public.categories WHERE id = duplicate_rec.category_ids[i];

      total_removed := total_removed + 1;
    END LOOP;

    total_updated := total_updated + 1;
  END LOOP;

  -- Clean up FAMILY-level duplicates case-insensitively (same family, same parent, same name ignoring case)
  FOR duplicate_rec IN 
    SELECT 
      family_id, 
      COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid) AS parent_norm,
      LOWER(name) AS name_lc,
      ARRAY_AGG(id ORDER BY created_at) AS category_ids
    FROM public.categories 
    WHERE family_id IS NOT NULL
    GROUP BY family_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), LOWER(name)
    HAVING COUNT(*) > 1
  LOOP
    keep_category_id := duplicate_rec.category_ids[1];

    FOR i IN 2..array_length(duplicate_rec.category_ids, 1) LOOP
      -- Update expenses that used the duplicate category (when saved as ID string)
      UPDATE public.expenses 
      SET category = keep_category_id::text
      WHERE category = duplicate_rec.category_ids[i]::text;

      -- Update receipt line items
      UPDATE public.receipt_line_items 
      SET category_id = keep_category_id 
      WHERE category_id = duplicate_rec.category_ids[i];

      UPDATE public.receipt_line_items 
      SET suggested_category_id = keep_category_id 
      WHERE suggested_category_id = duplicate_rec.category_ids[i];

      -- Re-parent any children to the kept category
      UPDATE public.categories 
      SET parent_id = keep_category_id 
      WHERE parent_id = duplicate_rec.category_ids[i];

      -- Delete the duplicate
      DELETE FROM public.categories WHERE id = duplicate_rec.category_ids[i];

      total_removed := total_removed + 1;
    END LOOP;

    total_updated := total_updated + 1;
  END LOOP;

  -- Return summary
  RETURN QUERY SELECT 
    total_removed,
    total_updated,
    CASE 
      WHEN total_removed > 0 THEN 
        'Removed ' || total_removed || ' duplicate categories and updated ' || total_updated || ' category groups'
      ELSE 
        'No duplicate categories found'
    END;
END;
$function$;

-- 2) Add UNIQUE INDEXES to prevent future duplicates (case-insensitive)

-- 2a) User-level budget categories: unique by user_id, lower(name), group_type when family_id IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS uniq_budget_categories_user_lowername_group
ON public.categories (user_id, lower(name), COALESCE(group_type, ''))
WHERE family_id IS NULL AND is_budget_category IS TRUE;

-- 2b) Family-level categories: unique by family_id, parent_id, lower(name)
-- Note: parent_id can be null; we normalize it through the partial index expression
CREATE UNIQUE INDEX IF NOT EXISTS uniq_family_categories_family_parent_lowername
ON public.categories (family_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name))
WHERE family_id IS NOT NULL;

