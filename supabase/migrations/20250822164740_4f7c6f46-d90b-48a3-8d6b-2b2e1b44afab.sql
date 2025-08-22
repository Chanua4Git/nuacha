-- Phase 1: Database Cleanup - Remove duplicate categories and fix references

-- Step 1: Clean up user-level budget category duplicates (family_id IS NULL)
DO $$
DECLARE
  duplicate_rec RECORD;
  keep_category_id UUID;
  total_cleaned INTEGER := 0;
BEGIN
  -- Find and clean user-level duplicates
  FOR duplicate_rec IN 
    SELECT user_id, name, group_type, COUNT(*) as cnt, array_agg(id ORDER BY created_at) as category_ids
    FROM public.categories 
    WHERE family_id IS NULL 
      AND is_budget_category = true
    GROUP BY user_id, name, group_type
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first (oldest) category
    keep_category_id := duplicate_rec.category_ids[1];
    
    -- Update all references to point to the kept category
    FOR i IN 2..array_length(duplicate_rec.category_ids, 1) LOOP
      -- Update expenses that reference the duplicate category as budget_category_id
      UPDATE public.expenses 
      SET budget_category_id = keep_category_id 
      WHERE budget_category_id = duplicate_rec.category_ids[i];
      
      -- Update receipt line items
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
      
      total_cleaned := total_cleaned + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Cleaned up % user-level duplicate categories', total_cleaned;
END $$;

-- Step 2: Clean up family-level category duplicates
DO $$
DECLARE
  duplicate_rec RECORD;
  keep_category_id UUID;
  total_cleaned INTEGER := 0;
BEGIN
  -- Find and clean family-level duplicates
  FOR duplicate_rec IN 
    SELECT family_id, name, COALESCE(parent_id::text, 'null') as parent_key, COUNT(*) as cnt, array_agg(id ORDER BY created_at) as category_ids
    FROM public.categories 
    WHERE family_id IS NOT NULL
    GROUP BY family_id, name, COALESCE(parent_id::text, 'null')
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first (oldest) category
    keep_category_id := duplicate_rec.category_ids[1];
    
    -- Update all references to point to the kept category
    FOR i IN 2..array_length(duplicate_rec.category_ids, 1) LOOP
      -- Update expenses that reference the duplicate category as regular category (stored as text)
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
      
      -- Update child categories to point to new parent
      UPDATE public.categories 
      SET parent_id = keep_category_id 
      WHERE parent_id = duplicate_rec.category_ids[i];
      
      -- Delete the duplicate category
      DELETE FROM public.categories WHERE id = duplicate_rec.category_ids[i];
      
      total_cleaned := total_cleaned + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Cleaned up % family-level duplicate categories', total_cleaned;
END $$;

-- Step 3: Add constraints to prevent future duplicates
-- Unique constraint for user-level budget categories
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_budget_unique 
ON public.categories (user_id, name) 
WHERE family_id IS NULL AND is_budget_category = true;

-- Unique constraint for family-level categories  
CREATE UNIQUE INDEX IF NOT EXISTS categories_family_unique 
ON public.categories (family_id, name, COALESCE(parent_id::text, 'null')) 
WHERE family_id IS NOT NULL;

-- Step 4: Update any orphaned expense references
UPDATE public.expenses 
SET budget_category_id = (
  SELECT c.id FROM public.categories c 
  WHERE c.user_id = (SELECT f.user_id FROM public.families f WHERE f.id = expenses.family_id)
    AND c.is_budget_category = true 
    AND c.family_id IS NULL
    AND c.group_type = 'wants'
  ORDER BY c.sort_order ASC 
  LIMIT 1
)
WHERE budget_category_id IS NULL
  AND EXISTS (SELECT 1 FROM public.families f WHERE f.id = expenses.family_id);