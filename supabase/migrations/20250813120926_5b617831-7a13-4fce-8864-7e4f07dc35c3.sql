-- Clean up duplicate budget categories and fix data integrity

-- Step 1: Create a function to clean up duplicate budget categories
CREATE OR REPLACE FUNCTION cleanup_duplicate_budget_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_rec RECORD;
  cat_rec RECORD;
  keep_category_id UUID;
BEGIN
  -- For each user, clean up duplicate budget categories
  FOR user_rec IN 
    SELECT DISTINCT user_id 
    FROM categories 
    WHERE is_budget_category = true
  LOOP
    -- Clean up user-level budget categories (family_id IS NULL)
    FOR cat_rec IN 
      SELECT name, group_type, COUNT(*) as cnt
      FROM categories 
      WHERE user_id = user_rec.user_id 
        AND family_id IS NULL 
        AND is_budget_category = true
      GROUP BY name, group_type
      HAVING COUNT(*) > 1
    LOOP
      -- Keep the first category and delete the rest
      SELECT id INTO keep_category_id
      FROM categories 
      WHERE user_id = user_rec.user_id 
        AND family_id IS NULL 
        AND is_budget_category = true
        AND name = cat_rec.name
        AND group_type = cat_rec.group_type
      ORDER BY created_at ASC
      LIMIT 1;
      
      -- Delete duplicates
      DELETE FROM categories 
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
      FROM categories 
      WHERE user_id = user_rec.user_id 
        AND family_id IS NOT NULL 
        AND is_budget_category = true
      GROUP BY family_id, name, group_type
      HAVING COUNT(*) > 1
    LOOP
      -- Keep the first category and delete the rest
      SELECT id INTO keep_category_id
      FROM categories 
      WHERE user_id = user_rec.user_id 
        AND family_id = cat_rec.family_id
        AND is_budget_category = true
        AND name = cat_rec.name
        AND group_type = cat_rec.group_type
      ORDER BY created_at ASC
      LIMIT 1;
      
      -- Delete duplicates
      DELETE FROM categories 
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

-- Step 2: Run the cleanup
SELECT cleanup_duplicate_budget_categories();

-- Step 3: Create a function to map expenses to budget categories
CREATE OR REPLACE FUNCTION map_expenses_to_budget_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exp_rec RECORD;
  matching_category_id UUID;
  family_user_id UUID;
BEGIN
  -- Update expenses that have null budget_category_id
  FOR exp_rec IN 
    SELECT e.id, e.family_id, e.category, e.description, f.user_id
    FROM expenses e
    JOIN families f ON e.family_id = f.id
    WHERE e.budget_category_id IS NULL
  LOOP
    -- Try to find a matching budget category by name
    SELECT c.id INTO matching_category_id
    FROM categories c
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
        FROM categories c
        WHERE c.user_id = exp_rec.user_id
          AND c.is_budget_category = true
          AND c.group_type = 'wants'
          AND LOWER(c.name) LIKE '%housekeeper%'
        LIMIT 1;
      END IF;
      
      -- Default childcare expenses
      IF matching_category_id IS NULL AND LOWER(exp_rec.description) LIKE '%child%' THEN
        SELECT c.id INTO matching_category_id
        FROM categories c
        WHERE c.user_id = exp_rec.user_id
          AND c.is_budget_category = true
          AND c.group_type = 'needs'
          AND LOWER(c.name) LIKE '%childcare%'
        LIMIT 1;
      END IF;
      
      -- If still no match, use the first "wants" category as default
      IF matching_category_id IS NULL THEN
        SELECT c.id INTO matching_category_id
        FROM categories c
        WHERE c.user_id = exp_rec.user_id
          AND c.is_budget_category = true
          AND c.group_type = 'wants'
        ORDER BY c.sort_order ASC
        LIMIT 1;
      END IF;
    END IF;
    
    -- Update the expense with the matching category
    IF matching_category_id IS NOT NULL THEN
      UPDATE expenses 
      SET budget_category_id = matching_category_id
      WHERE id = exp_rec.id;
      
      RAISE NOTICE 'Mapped expense % to category %', exp_rec.description, matching_category_id;
    END IF;
  END LOOP;
END;
$$;

-- Step 4: Run the expense mapping
SELECT map_expenses_to_budget_categories();

-- Step 5: Update the ensure_user_budget_categories function to prevent duplicates
CREATE OR REPLACE FUNCTION public.ensure_user_budget_categories(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check if user already has budget categories
  IF NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE user_id = user_uuid 
    AND is_budget_category = true
    AND family_id IS NULL  -- Only check user-level categories
    LIMIT 1
  ) THEN
    -- Create comprehensive budget categories for this user using the unified table
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
    (user_uuid, 'Unplanned purchases', '#F97316', 'wants', 114, true);
  END IF;
END;
$$;

-- Step 6: Add unique constraints to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_budget_unique 
ON categories (user_id, name, group_type) 
WHERE is_budget_category = true AND family_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_family_budget_unique 
ON categories (user_id, family_id, name, group_type) 
WHERE is_budget_category = true AND family_id IS NOT NULL;