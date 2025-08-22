-- Phase 1: Comprehensive Category Duplicate Cleanup (Fixed)
-- This migration will properly handle all duplicate categories and references

-- Step 1: Create a temporary function to migrate user-level categories to family level
CREATE OR REPLACE FUNCTION migrate_user_categories_to_families()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_rec RECORD;
  family_rec RECORD;
  category_rec RECORD;
  new_family_category_id UUID;
BEGIN
  -- For each user who has both user-level AND family-level categories
  FOR user_rec IN 
    SELECT DISTINCT user_id 
    FROM categories 
    WHERE user_id IS NOT NULL
  LOOP
    -- Get their primary family (first family created)
    SELECT id INTO family_rec
    FROM families 
    WHERE user_id = user_rec.user_id 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- Skip if user has no families
    CONTINUE WHEN family_rec.id IS NULL;
    
    -- For each user-level category that doesn't have a family equivalent
    FOR category_rec IN
      SELECT * FROM categories 
      WHERE user_id = user_rec.user_id 
        AND family_id IS NULL 
        AND is_budget_category = false
        AND NOT EXISTS (
          SELECT 1 FROM categories c2 
          WHERE c2.user_id = user_rec.user_id 
            AND c2.family_id = family_rec.id 
            AND LOWER(c2.name) = LOWER(categories.name)
        )
    LOOP
      -- Create family-level equivalent
      INSERT INTO categories (
        user_id, family_id, name, color, description, icon, 
        group_type, is_budget_category, budget, parent_id, sort_order
      ) VALUES (
        user_rec.user_id, family_rec.id, category_rec.name, category_rec.color,
        category_rec.description, category_rec.icon, category_rec.group_type,
        false, category_rec.budget, category_rec.parent_id, category_rec.sort_order
      ) RETURNING id INTO new_family_category_id;
      
      -- Update all expenses that reference the old user-level category
      UPDATE expenses 
      SET category = new_family_category_id::text
      WHERE category = category_rec.id::text;
      
      -- Update receipt line items
      UPDATE receipt_line_items 
      SET category_id = new_family_category_id
      WHERE category_id = category_rec.id;
      
      UPDATE receipt_line_items 
      SET suggested_category_id = new_family_category_id
      WHERE suggested_category_id = category_rec.id;
      
      -- Delete the old user-level category
      DELETE FROM categories WHERE id = category_rec.id;
      
      RAISE NOTICE 'Migrated user category % to family category %', category_rec.name, new_family_category_id;
    END LOOP;
  END LOOP;
END;
$$;

-- Step 2: Run the migration
SELECT migrate_user_categories_to_families();

-- Step 3: Clean up any remaining duplicates within families
CREATE OR REPLACE FUNCTION cleanup_family_category_duplicates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  duplicate_rec RECORD;
  keep_category_id UUID;
BEGIN
  -- Clean up family-level duplicates
  FOR duplicate_rec IN 
    SELECT family_id, LOWER(name) as name_lower, COUNT(*) as cnt, array_agg(id ORDER BY created_at) as category_ids
    FROM categories 
    WHERE family_id IS NOT NULL 
      AND is_budget_category = false
    GROUP BY family_id, LOWER(name)
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first (oldest) category
    keep_category_id := duplicate_rec.category_ids[1];
    
    -- Update references and delete duplicates
    FOR i IN 2..array_length(duplicate_rec.category_ids, 1) LOOP
      -- Update expenses
      UPDATE expenses 
      SET category = keep_category_id::text
      WHERE category = duplicate_rec.category_ids[i]::text;
      
      -- Update receipt line items
      UPDATE receipt_line_items 
      SET category_id = keep_category_id
      WHERE category_id = duplicate_rec.category_ids[i];
      
      UPDATE receipt_line_items 
      SET suggested_category_id = keep_category_id
      WHERE suggested_category_id = duplicate_rec.category_ids[i];
      
      -- Update child categories
      UPDATE categories 
      SET parent_id = keep_category_id
      WHERE parent_id = duplicate_rec.category_ids[i];
      
      -- Delete duplicate
      DELETE FROM categories WHERE id = duplicate_rec.category_ids[i];
    END LOOP;
    
    RAISE NOTICE 'Cleaned up % family duplicates for category %', duplicate_rec.cnt - 1, duplicate_rec.name_lower;
  END LOOP;
END;
$$;

-- Step 4: Run family cleanup
SELECT cleanup_family_category_duplicates();

-- Step 5: Create partial unique indexes to prevent future duplicates
-- Partial unique index for family-level categories (name must be unique within family)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_family_category_name 
ON categories (family_id, LOWER(name)) 
WHERE family_id IS NOT NULL AND is_budget_category = false;

-- Partial unique index for user-level budget categories
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_budget_category_name 
ON categories (user_id, LOWER(name)) 
WHERE family_id IS NULL AND is_budget_category = true;

-- Step 6: Drop the temporary functions
DROP FUNCTION IF EXISTS migrate_user_categories_to_families();
DROP FUNCTION IF EXISTS cleanup_family_category_duplicates();