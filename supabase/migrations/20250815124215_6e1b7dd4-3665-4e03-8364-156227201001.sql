-- Fix expense to budget category mapping

-- 1. First, update the specific JTA expense to link to the correct budget category
UPDATE public.expenses 
SET budget_category_id = 'b4e2afaf-faeb-43b9-8804-b5496ed278b1'
WHERE category = '2742dedc-be25-4289-aaf5-017130c29de6'
  AND amount = 1218.21;

-- 2. Create a comprehensive mapping function to link all unmapped expenses
CREATE OR REPLACE FUNCTION public.map_all_expenses_to_budget_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  exp_rec RECORD;
  matching_category_id UUID;
  regular_category_rec RECORD;
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
        ))
        OR (LOWER(c.name) LIKE '%household%' AND (
          LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) LIKE '%household%'
          OR LOWER(exp_rec.description) LIKE '%household%'
        ))
        OR (LOWER(c.name) LIKE '%medical%' AND (
          LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) LIKE '%medical%'
          OR LOWER(exp_rec.description) LIKE '%doctor%'
          OR LOWER(exp_rec.description) LIKE '%pharmacy%'
        ))
        OR (LOWER(c.name) LIKE '%transport%' AND (
          LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) LIKE '%transport%'
          OR LOWER(exp_rec.description) LIKE '%fuel%'
          OR LOWER(exp_rec.description) LIKE '%taxi%'
        ))
        OR (LOWER(c.name) LIKE '%childcare%' AND (
          LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) LIKE '%child%'
          OR LOWER(exp_rec.description) LIKE '%child%'
        ))
        OR (LOWER(c.name) LIKE '%school%' AND (
          LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) LIKE '%school%'
          OR LOWER(exp_rec.description) LIKE '%school%'
        ))
      )
    ORDER BY 
      CASE WHEN LOWER(c.name) = LOWER(COALESCE(regular_category_rec.name, exp_rec.category)) THEN 1 ELSE 2 END,
      c.created_at ASC
    LIMIT 1;
    
    -- If no specific match, try to categorize by expense description and use appropriate defaults
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
      
      RAISE NOTICE 'Mapped expense % (amount: %) to budget category %', exp_rec.description, exp_rec.amount, matching_category_id;
    ELSE
      RAISE NOTICE 'Could not map expense % (amount: %)', exp_rec.description, exp_rec.amount;
    END IF;
  END LOOP;
END;
$function$;

-- 3. Execute the mapping function
SELECT public.map_all_expenses_to_budget_categories();

-- 4. Update the existing get_or_create_budget_category function to be more robust
CREATE OR REPLACE FUNCTION public.get_or_create_budget_category(user_uuid uuid, family_uuid uuid, category_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  budget_category_id UUID;
  default_group_type TEXT := 'wants'; -- Default for new categories
BEGIN
  -- First try to find existing budget category by exact name match
  SELECT id INTO budget_category_id
  FROM public.categories 
  WHERE user_id = user_uuid 
    AND is_budget_category = true 
    AND family_id IS NULL  -- Only user-level budget categories
    AND LOWER(name) = LOWER(category_name)
  LIMIT 1;
  
  IF budget_category_id IS NOT NULL THEN
    RETURN budget_category_id;
  END IF;
  
  -- Try fuzzy matching for common categories
  SELECT id INTO budget_category_id
  FROM public.categories 
  WHERE user_id = user_uuid 
    AND is_budget_category = true 
    AND family_id IS NULL
    AND (
      (LOWER(name) LIKE '%groceries%' AND LOWER(category_name) LIKE '%groceries%')
      OR (LOWER(name) LIKE '%food%' AND LOWER(category_name) LIKE '%food%')
      OR (LOWER(name) LIKE '%household%' AND LOWER(category_name) LIKE '%household%')
      OR (LOWER(name) LIKE '%medical%' AND LOWER(category_name) LIKE '%medical%')
      OR (LOWER(name) LIKE '%transport%' AND LOWER(category_name) LIKE '%transport%')
      OR (LOWER(name) LIKE '%childcare%' AND LOWER(category_name) LIKE '%child%')
      OR (LOWER(name) LIKE '%school%' AND LOWER(category_name) LIKE '%school%')
    )
  ORDER BY 
    CASE WHEN LOWER(name) = LOWER(category_name) THEN 1 ELSE 2 END,
    sort_order ASC
  LIMIT 1;
  
  IF budget_category_id IS NOT NULL THEN
    RETURN budget_category_id;
  END IF;
  
  -- Determine appropriate group type based on category name
  IF LOWER(category_name) LIKE ANY(ARRAY['%groceries%', '%food%', '%medical%', '%health%', '%transport%', '%fuel%', '%rent%', '%mortgage%', '%utilities%', '%insurance%', '%childcare%', '%school%']) THEN
    default_group_type := 'needs';
  ELSIF LOWER(category_name) LIKE ANY(ARRAY['%saving%', '%investment%']) THEN
    default_group_type := 'savings';
  END IF;
  
  -- Create new budget category if none found
  INSERT INTO public.categories (
    user_id, 
    name, 
    color, 
    group_type, 
    is_budget_category,
    sort_order
  ) VALUES (
    user_uuid,
    category_name,
    CASE default_group_type
      WHEN 'needs' THEN '#EF4444'
      WHEN 'savings' THEN '#22C55E'
      ELSE '#F97316'
    END,
    default_group_type,
    true,
    999 -- Put new categories at the end
  ) RETURNING id INTO budget_category_id;
  
  RETURN budget_category_id;
END;
$function$;