-- Create function to reclassify incorrectly grouped categories (fixed version)
CREATE OR REPLACE FUNCTION public.reclassify_categories()
 RETURNS TABLE(categories_reclassified integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  wants_count INTEGER := 0;
  savings_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Reclassify categories that should be 'wants' but are marked as 'needs'
  WITH updated_rows AS (
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
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO wants_count FROM updated_rows;
  
  -- Reclassify categories that should be 'savings'
  WITH updated_rows AS (
    UPDATE public.categories 
    SET group_type = 'savings'
    WHERE group_type != 'savings' 
      AND (
        LOWER(name) LIKE '%saving%' OR
        LOWER(name) LIKE '%investment%' OR
        LOWER(name) LIKE '%retire%' OR
        LOWER(name) LIKE '%pension%' OR
        LOWER(name) LIKE '%emergency fund%'
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO savings_count FROM updated_rows;
  
  total_count := wants_count + savings_count;
  
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
    total_count,
    'Reclassified ' || total_count || ' categories (' || wants_count || ' to wants, ' || savings_count || ' to savings) and ensured Dining out category exists';
END;
$function$;