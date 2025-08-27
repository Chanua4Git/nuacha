-- Comprehensive Budget System Fix
-- This migration cleans up duplicate categories and fixes expense mappings

-- Step 1: Clean up duplicate budget categories (keep oldest, remove duplicates)
DO $$
DECLARE
  duplicate_rec RECORD;
  keep_category_id UUID;
  total_removed INTEGER := 0;
BEGIN
  -- Clean up user-level budget category duplicates (family_id IS NULL)
  FOR duplicate_rec IN 
    SELECT user_id, name, group_type, COUNT(*) as duplicate_count, array_agg(id ORDER BY created_at) as category_ids
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
      -- Update expenses that reference the duplicate category
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
  END LOOP;
  
  RAISE NOTICE 'Removed % duplicate budget categories', total_removed;
END $$;

-- Step 2: Fix orphaned expense references (expenses with null or invalid budget_category_id)
DO $$
DECLARE
  exp_rec RECORD;
  matching_category_id UUID;
  regular_category_rec RECORD;
  mapped_count INTEGER := 0;
BEGIN
  -- Update all expenses that have null budget_category_id
  FOR exp_rec IN 
    SELECT e.id, e.family_id, e.category, e.description, f.user_id, e.amount
    FROM public.expenses e
    JOIN public.families f ON e.family_id = f.id
    WHERE e.budget_category_id IS NULL
  LOOP
    -- First try to get the regular category details
    SELECT name INTO regular_category_rec
    FROM public.categories 
    WHERE id = exp_rec.category::UUID
    LIMIT 1;
    
    -- Try to find a matching budget category by name
    SELECT c.id INTO matching_category_id
    FROM public.categories c
    WHERE c.user_id = exp_rec.user_id
      AND c.is_budget_category = true
      AND c.family_id IS NULL  -- Only user-level budget categories
      AND (
        -- Try exact name match first
        LOWER(c.name) = LOWER(COALESCE(regular_category_rec.name, exp_rec.category))
        -- Try partial matches for common categories
        OR (LOWER(c.name) LIKE '%groceries%' AND (
          LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) LIKE '%groceries%'
          OR LOWER(exp_rec.description) LIKE '%grocery%'
          OR LOWER(exp_rec.description) LIKE '%food%'
          OR LOWER(exp_rec.description) LIKE '%supermarket%'
          OR LOWER(exp_rec.description) LIKE '%jta%'
        ))
        OR (LOWER(c.name) LIKE '%household%' AND (
          LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) LIKE '%household%'
          OR LOWER(exp_rec.description) LIKE '%household%'
        ))
        OR (LOWER(c.name) LIKE '%housekeeper%' AND (
          LOWER(exp_rec.description) LIKE '%clean%'
          OR LOWER(exp_rec.description) LIKE '%housekeeper%'
        ))
        OR (LOWER(c.name) LIKE '%medical%' AND (
          LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) LIKE '%medical%'
          OR LOWER(exp_rec.description) LIKE '%doctor%'
          OR LOWER(exp_rec.description) LIKE '%pharmacy%'
        ))
        OR (LOWER(c.name) LIKE '%fuel%' AND (
          LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) LIKE '%fuel%'
          OR LOWER(exp_rec.description) LIKE '%fuel%'
          OR LOWER(exp_rec.description) LIKE '%gas%'
        ))
        OR (LOWER(c.name) LIKE '%childcare%' AND (
          LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) LIKE '%child%'
          OR LOWER(exp_rec.description) LIKE '%child%'
        ))
        OR (LOWER(c.name) LIKE '%school%' AND (
          LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) LIKE '%school%'
          OR LOWER(exp_rec.description) LIKE '%school%'
        ))
        OR (LOWER(c.name) LIKE '%dining%' AND (
          LOWER(exp_rec.description) LIKE '%restaurant%'
          OR LOWER(exp_rec.description) LIKE '%takeout%'
          OR LOWER(exp_rec.description) LIKE '%delivery%'
        ))
      )
    ORDER BY 
      CASE WHEN LOWER(c.name) = LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) THEN 1 ELSE 2 END,
      c.created_at ASC
    LIMIT 1;
    
    -- If no specific match, use intelligent defaults based on description
    IF matching_category_id IS NULL THEN
      -- Default household/grocery expenses to "Groceries"
      IF LOWER(exp_rec.description) LIKE '%jta%' 
         OR LOWER(exp_rec.description) LIKE '%supermarket%'
         OR LOWER(exp_rec.description) LIKE '%grocery%' 
         OR LOWER(exp_rec.description) LIKE '%food%' THEN
        SELECT c.id INTO matching_category_id
        FROM public.categories c
        WHERE c.user_id = exp_rec.user_id
          AND c.is_budget_category = true
          AND c.family_id IS NULL
          AND LOWER(c.name) LIKE '%groceries%'
        ORDER BY c.sort_order ASC
        LIMIT 1;
      END IF;
      
      -- Default childcare expenses
      IF matching_category_id IS NULL AND LOWER(exp_rec.description) LIKE '%child%' THEN
        SELECT c.id INTO matching_category_id
        FROM public.categories c
        WHERE c.user_id = exp_rec.user_id
          AND c.is_budget_category = true
          AND c.family_id IS NULL
          AND LOWER(c.name) LIKE '%childcare%'
        LIMIT 1;
      END IF;
      
      -- Default cleaning/housekeeper expenses
      IF matching_category_id IS NULL AND LOWER(exp_rec.description) LIKE '%clean%' THEN
        SELECT c.id INTO matching_category_id
        FROM public.categories c
        WHERE c.user_id = exp_rec.user_id
          AND c.is_budget_category = true
          AND c.family_id IS NULL
          AND LOWER(c.name) LIKE '%housekeeper%'
        LIMIT 1;
      END IF;
      
      -- If still no match, use the first "wants" category as default
      IF matching_category_id IS NULL THEN
        SELECT c.id INTO matching_category_id
        FROM public.categories c
        WHERE c.user_id = exp_rec.user_id
          AND c.is_budget_category = true
          AND c.family_id IS NULL
          AND c.group_type = 'wants'
        ORDER BY c.sort_order ASC
        LIMIT 1;
      END IF;
    END IF;
    
    -- Update the expense with the matching category
    IF matching_category_id IS NOT NULL THEN
      UPDATE public.expenses 
      SET budget_category_id = matching_category_id
      WHERE id = exp_rec.id;
      
      mapped_count := mapped_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Mapped % expenses to budget categories', mapped_count;
END $$;

-- Step 3: Ensure all users have the essential budget categories
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN 
    SELECT DISTINCT user_id FROM public.families
  LOOP
    -- Ensure user has budget categories
    PERFORM public.ensure_user_budget_categories_safe(user_rec.user_id);
  END LOOP;
END $$;

-- Step 4: Update budget allocation rules (ensure 50/30/20 rule exists for all users)
INSERT INTO public.budget_allocations (user_id, rule_name, needs_pct, wants_pct, savings_pct, is_default)
SELECT DISTINCT f.user_id, '50/30/20 Rule', 50, 30, 20, true
FROM public.families f
WHERE NOT EXISTS (
  SELECT 1 FROM public.budget_allocations ba 
  WHERE ba.user_id = f.user_id AND ba.is_default = true
)
ON CONFLICT DO NOTHING;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_budget_category_id ON public.expenses(budget_category_id) WHERE budget_category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_budget_user ON public.categories(user_id, is_budget_category) WHERE is_budget_category = true;
CREATE INDEX IF NOT EXISTS idx_categories_group_type ON public.categories(group_type) WHERE is_budget_category = true;