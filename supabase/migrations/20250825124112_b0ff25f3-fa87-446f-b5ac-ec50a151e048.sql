-- Fix the cleanup_duplicate_categories_advanced function with proper GROUP BY handling
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
    
    total_updated := total_updated + 1;
  END LOOP;
  
  -- Clean up family-level category duplicates with proper parent_id handling
  FOR duplicate_rec IN 
    SELECT family_id, name, parent_id, COUNT(*) as duplicate_count, array_agg(id ORDER BY created_at) as category_ids
    FROM public.categories 
    WHERE family_id IS NOT NULL
    GROUP BY family_id, name, parent_id -- Fixed: removed COALESCE wrapping
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first (oldest) category
    keep_category_id := duplicate_rec.category_ids[1];
    
    -- Update all references to point to the kept category
    FOR i IN 2..array_length(duplicate_rec.category_ids, 1) LOOP
      -- Update expenses that reference the duplicate category as regular category
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

-- Create function to reclassify incorrectly grouped categories
CREATE OR REPLACE FUNCTION public.reclassify_categories()
 RETURNS TABLE(categories_reclassified integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  reclassified_count INTEGER := 0;
BEGIN
  -- Reclassify categories that should be 'wants' but are marked as 'needs'
  UPDATE public.categories 
  SET group_type = 'wants'
  WHERE group_type = 'needs' 
    AND (
      LOWER(name) LIKE '%dining%' OR
      LOWER(name) LIKE '%restaurant%' OR
      LOWER(name) LIKE '%entertainment%' OR
      LOWER(name) LIKE '%shopping%' OR
      LOWER(name) LIKE '%clothes%' OR
      LOWER(name) LIKE '%clothing%' OR
      LOWER(name) LIKE '%hobby%' OR
      LOWER(name) LIKE '%hobbies%' OR
      LOWER(name) LIKE '%crafts%' OR
      LOWER(name) LIKE '%gift%' OR
      LOWER(name) LIKE '%present%' OR
      LOWER(name) LIKE '%vacation%' OR
      LOWER(name) LIKE '%travel%' OR
      LOWER(name) LIKE '%leisure%' OR
      LOWER(name) LIKE '%spa%' OR
      LOWER(name) LIKE '%massage%' OR
      LOWER(name) LIKE '%gym%' OR
      LOWER(name) LIKE '%subscription%' OR
      LOWER(name) LIKE '%streaming%' OR
      LOWER(name) LIKE '%cable%' OR
      LOWER(name) LIKE '%housekeeper%' OR
      LOWER(name) LIKE '%garden%' OR
      LOWER(name) LIKE '%pool%' OR
      LOWER(name) LIKE '%birthday%' OR
      LOWER(name) LIKE '%holiday%' OR
      LOWER(name) LIKE '%anniversary%' OR
      LOWER(name) LIKE '%wedding%' OR
      LOWER(name) LIKE '%celebration%' OR
      LOWER(name) LIKE '%accommodation%' OR
      LOWER(name) LIKE '%flight%' OR
      LOWER(name) LIKE '%activities%' OR
      LOWER(name) LIKE '%tours%' OR
      LOWER(name) LIKE '%donation%' OR
      LOWER(name) LIKE '%charity%' OR
      LOWER(name) LIKE '%unplanned%' OR
      LOWER(name) LIKE '%extracurricular%' OR
      LOWER(name) LIKE '%haircut%' OR
      LOWER(name) LIKE '%grooming%' OR
      LOWER(name) LIKE '%vitamin%' OR
      LOWER(name) LIKE '%supplement%' OR
      LOWER(name) LIKE '%event%' OR
      LOWER(name) LIKE '%ticket%'
    );
    
  GET DIAGNOSTICS reclassified_count = ROW_COUNT;
  
  -- Reclassify categories that should be 'savings'
  UPDATE public.categories 
  SET group_type = 'savings'
  WHERE group_type != 'savings' 
    AND (
      LOWER(name) LIKE '%saving%' OR
      LOWER(name) LIKE '%investment%' OR
      LOWER(name) LIKE '%retire%' OR
      LOWER(name) LIKE '%pension%' OR
      LOWER(name) LIKE '%emergency fund%'
    );
    
  GET DIAGNOSTICS reclassified_count = reclassified_count + ROW_COUNT;
  
  -- Ensure "Dining out" category exists for all users as 'wants'
  INSERT INTO public.categories (user_id, name, color, group_type, is_budget_category, sort_order)
  SELECT DISTINCT u.user_id, 'Dining out', '#F97316', 'wants', true, 85
  FROM (
    SELECT DISTINCT user_id FROM public.categories WHERE is_budget_category = true
  ) u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c 
    WHERE c.user_id = u.user_id 
      AND c.is_budget_category = true 
      AND LOWER(c.name) = 'dining out'
  );
  
  RETURN QUERY SELECT 
    reclassified_count,
    'Reclassified ' || reclassified_count || ' categories and ensured Dining out category exists';
END;
$function$;