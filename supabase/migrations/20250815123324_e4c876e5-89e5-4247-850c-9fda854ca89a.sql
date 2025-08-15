-- First, fix the existing JTA expense and similar issues
-- Map expenses to their appropriate budget categories and populate budget_category_id

UPDATE expenses 
SET budget_category_id = (
  SELECT c.id 
  FROM categories c 
  JOIN families f ON f.user_id = c.user_id 
  WHERE expenses.family_id = f.id 
    AND c.is_budget_category = true 
    AND (
      -- Direct name match
      LOWER(c.name) = LOWER(expenses.category)
      -- Or fuzzy matches for common categories
      OR (LOWER(c.name) LIKE '%groceries%' AND LOWER(expenses.category) LIKE '%groceries%')
      OR (LOWER(c.name) LIKE '%food%' AND LOWER(expenses.category) LIKE '%food%')
      OR (LOWER(c.name) LIKE '%household%' AND LOWER(expenses.category) LIKE '%household%')
      OR (LOWER(c.name) LIKE '%medical%' AND LOWER(expenses.category) LIKE '%medical%')
      OR (LOWER(c.name) LIKE '%transport%' AND LOWER(expenses.category) LIKE '%transport%')
      OR (LOWER(c.name) LIKE '%childcare%' AND LOWER(expenses.category) LIKE '%child%')
      OR (LOWER(c.name) LIKE '%school%' AND LOWER(expenses.category) LIKE '%school%')
      OR (LOWER(c.name) LIKE '%education%' AND LOWER(expenses.category) LIKE '%education%')
    )
  LIMIT 1
)
WHERE budget_category_id IS NULL;

-- Create function to find or create budget categories for OCR processing
CREATE OR REPLACE FUNCTION public.get_or_create_budget_category(
  user_uuid UUID,
  family_uuid UUID,
  category_name TEXT
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  budget_category_id UUID;
  default_group_type TEXT := 'wants'; -- Default for new categories
BEGIN
  -- First try to find existing budget category by exact name match
  SELECT id INTO budget_category_id
  FROM public.categories 
  WHERE user_id = user_uuid 
    AND is_budget_category = true 
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
    AND (
      (LOWER(name) LIKE '%groceries%' AND LOWER(category_name) LIKE '%groceries%')
      OR (LOWER(name) LIKE '%food%' AND LOWER(category_name) LIKE '%food%')
      OR (LOWER(name) LIKE '%household%' AND LOWER(category_name) LIKE '%household%')
      OR (LOWER(name) LIKE '%medical%' AND LOWER(category_name) LIKE '%medical%')
      OR (LOWER(name) LIKE '%transport%' AND LOWER(category_name) LIKE '%transport%')
      OR (LOWER(name) LIKE '%childcare%' AND LOWER(category_name) LIKE '%child%')
      OR (LOWER(name) LIKE '%school%' AND LOWER(category_name) LIKE '%school%')
    )
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
$$;