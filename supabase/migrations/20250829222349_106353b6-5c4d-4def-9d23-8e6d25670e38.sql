-- Clean up duplicate "Dining out" categories and ensure proper categorization
DO $$
DECLARE
  user_record RECORD;
  duplicate_rec RECORD;
  keep_category_id UUID;
BEGIN
  -- Clean up duplicate "Dining out" categories for each user
  FOR user_record IN 
    SELECT DISTINCT user_id FROM public.categories 
    WHERE (LOWER(name) LIKE '%dining%' OR LOWER(name) = 'dining out') 
      AND is_budget_category = true
  LOOP
    -- Find duplicates for this user
    FOR duplicate_rec IN
      SELECT array_agg(id ORDER BY created_at) as category_ids, COUNT(*) as cnt
      FROM public.categories 
      WHERE user_id = user_record.user_id 
        AND (LOWER(name) LIKE '%dining%' OR LOWER(name) = 'dining out')
        AND is_budget_category = true
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
      END LOOP;
      
      -- Ensure the kept category has the correct name
      UPDATE public.categories 
      SET name = 'Dining out', group_type = 'wants'
      WHERE id = keep_category_id;
      
      RAISE NOTICE 'Cleaned up % dining duplicates for user %', duplicate_rec.cnt - 1, user_record.user_id;
    END LOOP;
  END LOOP;
  
  -- Ensure all users have a "Dining out" category
  INSERT INTO public.categories (user_id, name, color, group_type, is_budget_category, sort_order)
  SELECT DISTINCT u.user_id, 'Dining out', '#F97316', 'wants', true, 80
  FROM (
    SELECT DISTINCT user_id FROM public.categories WHERE is_budget_category = true
  ) u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c 
    WHERE c.user_id = u.user_id 
      AND c.is_budget_category = true 
      AND (LOWER(c.name) = 'dining out' OR LOWER(c.name) LIKE '%dining%')
  );

END $$;