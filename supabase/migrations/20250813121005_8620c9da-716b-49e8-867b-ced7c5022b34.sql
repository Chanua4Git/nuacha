-- Fix security warnings by setting search_path for functions

-- Fix cleanup_duplicate_budget_categories function
CREATE OR REPLACE FUNCTION cleanup_duplicate_budget_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_rec RECORD;
  cat_rec RECORD;
  keep_category_id UUID;
BEGIN
  -- For each user, clean up duplicate budget categories
  FOR user_rec IN 
    SELECT DISTINCT user_id 
    FROM public.categories 
    WHERE is_budget_category = true
  LOOP
    -- Clean up user-level budget categories (family_id IS NULL)
    FOR cat_rec IN 
      SELECT name, group_type, COUNT(*) as cnt
      FROM public.categories 
      WHERE user_id = user_rec.user_id 
        AND family_id IS NULL 
        AND is_budget_category = true
      GROUP BY name, group_type
      HAVING COUNT(*) > 1
    LOOP
      -- Keep the first category and delete the rest
      SELECT id INTO keep_category_id
      FROM public.categories 
      WHERE user_id = user_rec.user_id 
        AND family_id IS NULL 
        AND is_budget_category = true
        AND name = cat_rec.name
        AND group_type = cat_rec.group_type
      ORDER BY created_at ASC
      LIMIT 1;
      
      -- Delete duplicates
      DELETE FROM public.categories 
      WHERE user_id = user_rec.user_id 
        AND family_id IS NULL 
        AND is_budget_category = true
        AND name = cat_rec.name
        AND group_type = cat_rec.group_type
        AND id != keep_category_id;
        
      RAISE NOTICE 'Cleaned up % duplicates for user % category %', cat_rec.cnt - 1, user_rec.user_id, cat_rec.name;
    END LOOP;
    
    -- Clean up family-level budget categories
    FOR cat_rec IN 
      SELECT family_id, name, group_type, COUNT(*) as cnt
      FROM public.categories 
      WHERE user_id = user_rec.user_id 
        AND family_id IS NOT NULL 
        AND is_budget_category = true
      GROUP BY family_id, name, group_type
      HAVING COUNT(*) > 1
    LOOP
      -- Keep the first category and delete the rest
      SELECT id INTO keep_category_id
      FROM public.categories 
      WHERE user_id = user_rec.user_id 
        AND family_id = cat_rec.family_id
        AND is_budget_category = true
        AND name = cat_rec.name
        AND group_type = cat_rec.group_type
      ORDER BY created_at ASC
      LIMIT 1;
      
      -- Delete duplicates
      DELETE FROM public.categories 
      WHERE user_id = user_rec.user_id 
        AND family_id = cat_rec.family_id
        AND is_budget_category = true
        AND name = cat_rec.name
        AND group_type = cat_rec.group_type
        AND id != keep_category_id;
        
      RAISE NOTICE 'Cleaned up % family duplicates for user % category %', cat_rec.cnt - 1, user_rec.user_id, cat_rec.name;
    END LOOP;
  END LOOP;
END;
$$;

-- Fix map_expenses_to_budget_categories function
CREATE OR REPLACE FUNCTION map_expenses_to_budget_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  exp_rec RECORD;
  matching_category_id UUID;
  family_user_id UUID;
BEGIN
  -- Update expenses that have null budget_category_id
  FOR exp_rec IN 
    SELECT e.id, e.family_id, e.category, e.description, f.user_id
    FROM public.expenses e
    JOIN public.families f ON e.family_id = f.id
    WHERE e.budget_category_id IS NULL
  LOOP
    -- Try to find a matching budget category by name
    SELECT c.id INTO matching_category_id
    FROM public.categories c
    WHERE c.user_id = exp_rec.user_id
      AND c.is_budget_category = true
      AND (
        -- Try exact name match first
        LOWER(c.name) = LOWER(exp_rec.category)
        -- Try partial matches for common categories
        OR (LOWER(c.name) LIKE '%housekeeper%' AND LOWER(exp_rec.description) LIKE '%clean%')
        OR (LOWER(c.name) LIKE '%childcare%' AND LOWER(exp_rec.description) LIKE '%child%')
        OR (LOWER(c.name) LIKE '%groceries%' AND LOWER(exp_rec.description) LIKE '%grocery%')
        OR (LOWER(c.name) LIKE '%household%' AND LOWER(exp_rec.description) LIKE '%household%')
      )
    ORDER BY 
      CASE WHEN LOWER(c.name) = LOWER(exp_rec.category) THEN 1 ELSE 2 END,
      c.created_at ASC
    LIMIT 1;
    
    -- If no specific match, try to categorize by expense type
    IF matching_category_id IS NULL THEN
      -- Default household operations to "Housekeeper" or similar household category
      IF LOWER(exp_rec.description) LIKE '%clean%' OR LOWER(exp_rec.description) LIKE '%cook%' THEN
        SELECT c.id INTO matching_category_id
        FROM public.categories c
        WHERE c.user_id = exp_rec.user_id
          AND c.is_budget_category = true
          AND c.group_type = 'wants'
          AND LOWER(c.name) LIKE '%housekeeper%'
        LIMIT 1;
      END IF;
      
      -- Default childcare expenses
      IF matching_category_id IS NULL AND LOWER(exp_rec.description) LIKE '%child%' THEN
        SELECT c.id INTO matching_category_id
        FROM public.categories c
        WHERE c.user_id = exp_rec.user_id
          AND c.is_budget_category = true
          AND c.group_type = 'needs'
          AND LOWER(c.name) LIKE '%childcare%'
        LIMIT 1;
      END IF;
      
      -- If still no match, use the first "wants" category as default
      IF matching_category_id IS NULL THEN
        SELECT c.id INTO matching_category_id
        FROM public.categories c
        WHERE c.user_id = exp_rec.user_id
          AND c.is_budget_category = true
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
      
      RAISE NOTICE 'Mapped expense % to category %', exp_rec.description, matching_category_id;
    END IF;
  END LOOP;
END;
$$;