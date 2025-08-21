-- Clean up duplicate categories and improve sync logic
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_categories_advanced()
RETURNS TABLE(
  duplicates_removed INTEGER,
  categories_updated INTEGER,
  message TEXT
) 
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
  
  -- Clean up family-level category duplicates  
  FOR duplicate_rec IN 
    SELECT family_id, name, parent_id, COUNT(*) as duplicate_count, array_agg(id ORDER BY created_at) as category_ids
    FROM public.categories 
    WHERE family_id IS NOT NULL
    GROUP BY family_id, name, COALESCE(parent_id::text, 'null')
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

-- Enhanced version of ensure_user_budget_categories that prevents duplicates
CREATE OR REPLACE FUNCTION public.ensure_user_budget_categories_safe(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  category_exists BOOLEAN;
BEGIN
  -- First check if user already has ANY budget categories to avoid complete re-creation
  SELECT EXISTS(
    SELECT 1 FROM public.categories 
    WHERE user_id = user_uuid 
      AND is_budget_category = true
      AND family_id IS NULL
    LIMIT 1
  ) INTO category_exists;
  
  -- Only create if no budget categories exist
  IF NOT category_exists THEN
    -- Insert comprehensive budget categories with ON CONFLICT handling
    INSERT INTO public.categories (user_id, name, color, group_type, sort_order, is_budget_category) VALUES
    -- Housing & Utilities (Needs)
    (user_uuid, 'Rent / Mortgage', '#EF4444', 'needs', 1, true),
    (user_uuid, 'Electricity', '#EF4444', 'needs', 2, true),
    (user_uuid, 'Water & Sewer', '#EF4444', 'needs', 3, true),
    (user_uuid, 'Gas', '#EF4444', 'needs', 4, true),
    (user_uuid, 'Internet / Wi-Fi', '#EF4444', 'needs', 5, true),
    (user_uuid, 'Cable / Streaming services', '#F97316', 'wants', 6, true),
    (user_uuid, 'Garbage collection', '#EF4444', 'needs', 7, true),

    -- Caregiving & Medical (Needs) 
    (user_uuid, 'Day nurse', '#EF4444', 'needs', 10, true),
    (user_uuid, 'Night nurse', '#EF4444', 'needs', 11, true),
    (user_uuid, 'Doctor visits', '#EF4444', 'needs', 12, true),
    (user_uuid, 'Specialist visits', '#EF4444', 'needs', 13, true),
    (user_uuid, 'Medical tests', '#EF4444', 'needs', 14, true),
    (user_uuid, 'Medication', '#EF4444', 'needs', 15, true),
    (user_uuid, 'Medical supplies', '#EF4444', 'needs', 16, true),

    -- Household Operations (Mixed)
    (user_uuid, 'Housekeeper', '#F97316', 'wants', 20, true),
    (user_uuid, 'Garden services', '#F97316', 'wants', 21, true),
    (user_uuid, 'Pool maintenance', '#F97316', 'wants', 22, true),
    (user_uuid, 'Pest control', '#EF4444', 'needs', 23, true),
    (user_uuid, 'Laundry', '#EF4444', 'needs', 24, true),
    (user_uuid, 'Household repairs', '#EF4444', 'needs', 25, true),
    (user_uuid, 'Appliance repairs', '#EF4444', 'needs', 26, true),

    -- Groceries & Household Supplies (Needs)
    (user_uuid, 'Groceries', '#EF4444', 'needs', 30, true),
    (user_uuid, 'Pet food & supplies', '#EF4444', 'needs', 31, true),
    (user_uuid, 'Toiletries', '#EF4444', 'needs', 32, true),
    (user_uuid, 'Paper goods', '#EF4444', 'needs', 33, true),

    -- Transportation (Needs)
    (user_uuid, 'Fuel', '#EF4444', 'needs', 40, true),
    (user_uuid, 'Taxi / rideshare', '#EF4444', 'needs', 41, true),
    (user_uuid, 'Public transportation', '#EF4444', 'needs', 42, true),
    (user_uuid, 'Vehicle maintenance', '#EF4444', 'needs', 43, true),
    (user_uuid, 'Vehicle insurance', '#EF4444', 'needs', 44, true),
    (user_uuid, 'Vehicle loan payment', '#EF4444', 'needs', 45, true),

    -- Insurance & Financial (Needs/Savings)
    (user_uuid, 'Health insurance', '#EF4444', 'needs', 50, true),
    (user_uuid, 'Life insurance', '#EF4444', 'needs', 51, true),
    (user_uuid, 'Home insurance', '#EF4444', 'needs', 52, true),
    (user_uuid, 'Other insurance', '#EF4444', 'needs', 53, true),
    (user_uuid, 'Loan repayments', '#EF4444', 'needs', 54, true),
    (user_uuid, 'Savings', '#22C55E', 'savings', 55, true),
    (user_uuid, 'Investments', '#22C55E', 'savings', 56, true),

    -- Personal Care & Wellness (Wants)
    (user_uuid, 'Haircuts & grooming', '#F97316', 'wants', 60, true),
    (user_uuid, 'Spa & massage', '#F97316', 'wants', 61, true),
    (user_uuid, 'Gym membership', '#F97316', 'wants', 62, true),
    (user_uuid, 'Vitamins & supplements', '#F97316', 'wants', 63, true),

    -- Education & Child Expenses (Needs)
    (user_uuid, 'School fees', '#EF4444', 'needs', 70, true),
    (user_uuid, 'Books & stationery', '#EF4444', 'needs', 71, true),
    (user_uuid, 'Extracurricular activities', '#F97316', 'wants', 72, true),
    (user_uuid, 'School uniforms', '#EF4444', 'needs', 73, true),
    (user_uuid, 'Childcare', '#EF4444', 'needs', 74, true),

    -- Entertainment & Leisure (Wants)
    (user_uuid, 'Dining out', '#F97316', 'wants', 80, true),
    (user_uuid, 'Subscriptions', '#F97316', 'wants', 81, true),
    (user_uuid, 'Events & tickets', '#F97316', 'wants', 82, true),
    (user_uuid, 'Hobbies & crafts', '#F97316', 'wants', 83, true),

    -- Gifts & Special Occasions (Wants)
    (user_uuid, 'Birthday gifts', '#F97316', 'wants', 90, true),
    (user_uuid, 'Holiday gifts', '#F97316', 'wants', 91, true),
    (user_uuid, 'Anniversaries', '#F97316', 'wants', 92, true),
    (user_uuid, 'Weddings & celebrations', '#F97316', 'wants', 93, true),

    -- Travel & Holidays (Wants)
    (user_uuid, 'Flights & transportation', '#F97316', 'wants', 100, true),
    (user_uuid, 'Accommodation', '#F97316', 'wants', 101, true),
    (user_uuid, 'Travel insurance', '#F97316', 'wants', 102, true),
    (user_uuid, 'Activities & tours', '#F97316', 'wants', 103, true),

    -- Miscellaneous (Various)
    (user_uuid, 'Emergency expenses', '#EF4444', 'needs', 110, true),
    (user_uuid, 'Donations & charity', '#F97316', 'wants', 111, true),
    (user_uuid, 'Legal fees', '#EF4444', 'needs', 112, true),
    (user_uuid, 'Bank fees', '#EF4444', 'needs', 113, true),
    (user_uuid, 'Unplanned purchases', '#F97316', 'wants', 114, true)
    ON CONFLICT (user_id, name) WHERE family_id IS NULL AND is_budget_category = true 
    DO NOTHING;
  END IF;
END;
$function$;