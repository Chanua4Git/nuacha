-- Clean up existing "Food" categories and fix category inconsistencies

-- First, find and update any expenses that use "Food" categories to use "Groceries" instead
DO $$
DECLARE
  food_category_rec RECORD;
  groceries_category_id UUID;
  user_uuid UUID;
BEGIN
  -- Loop through all "Food" categories
  FOR food_category_rec IN 
    SELECT id, user_id, family_id, name 
    FROM public.categories 
    WHERE LOWER(name) LIKE '%food%' OR name = 'Food'
  LOOP
    -- Get the user_id for this category
    user_uuid := food_category_rec.user_id;
    
    -- Find or create a "Groceries" category for this user/family
    SELECT id INTO groceries_category_id
    FROM public.categories 
    WHERE user_id = user_uuid 
      AND (family_id = food_category_rec.family_id OR (family_id IS NULL AND food_category_rec.family_id IS NULL))
      AND LOWER(name) = 'groceries'
    LIMIT 1;
    
    -- If no Groceries category exists, create one
    IF groceries_category_id IS NULL THEN
      INSERT INTO public.categories (
        user_id, 
        family_id, 
        name, 
        color, 
        group_type, 
        is_budget_category,
        sort_order
      ) VALUES (
        user_uuid,
        food_category_rec.family_id,
        'Groceries',
        '#10B981',
        CASE WHEN food_category_rec.family_id IS NULL AND EXISTS(SELECT 1 FROM public.categories WHERE id = food_category_rec.id AND is_budget_category = true) THEN 'needs' ELSE NULL END,
        CASE WHEN food_category_rec.family_id IS NULL THEN true ELSE false END,
        30
      ) RETURNING id INTO groceries_category_id;
      
      RAISE NOTICE 'Created new Groceries category % for user %', groceries_category_id, user_uuid;
    END IF;
    
    -- Update all expenses that use the Food category to use Groceries
    UPDATE public.expenses 
    SET category = groceries_category_id::text
    WHERE category = food_category_rec.id::text;
    
    -- Update budget_category_id for expenses
    UPDATE public.expenses 
    SET budget_category_id = groceries_category_id
    WHERE budget_category_id = food_category_rec.id;
    
    -- Update receipt line items
    UPDATE public.receipt_line_items 
    SET category_id = groceries_category_id
    WHERE category_id = food_category_rec.id;
    
    -- Update suggested category references
    UPDATE public.receipt_line_items 
    SET suggested_category_id = groceries_category_id
    WHERE suggested_category_id = food_category_rec.id;
    
    -- Update budgets table
    UPDATE public.budgets 
    SET category_id = groceries_category_id
    WHERE category_id = food_category_rec.id;
    
    -- Update categorization rules
    UPDATE public.categorization_rules 
    SET category_id = groceries_category_id
    WHERE category_id = food_category_rec.id;
    
    RAISE NOTICE 'Updated all references from Food category % to Groceries category %', food_category_rec.id, groceries_category_id;
    
    -- Delete the Food category
    DELETE FROM public.categories WHERE id = food_category_rec.id;
    
    RAISE NOTICE 'Deleted Food category % named "%"', food_category_rec.id, food_category_rec.name;
  END LOOP;
END $$;

-- Clean up any categorization rules that might create "Food" categories
UPDATE public.categorization_rules 
SET pattern = 'groceries'
WHERE LOWER(pattern) = 'food' OR pattern = 'Food';

-- Add a constraint to prevent creation of "Food" categories in the future
-- We'll use a check constraint to ensure category names follow our standards
ALTER TABLE public.categories 
ADD CONSTRAINT check_no_food_category 
CHECK (LOWER(name) != 'food');