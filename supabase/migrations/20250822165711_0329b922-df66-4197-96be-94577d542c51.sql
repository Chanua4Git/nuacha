-- Simple Category Duplicate Cleanup
-- Work with existing constraints and just remove duplicates

-- Step 1: Update expenses to point to family-level categories where duplicates exist
CREATE OR REPLACE FUNCTION fix_expense_category_references()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exp_rec RECORD;
  family_category_id UUID;
BEGIN
  -- For each expense that points to a user-level category, try to find family equivalent
  FOR exp_rec IN 
    SELECT e.id as expense_id, e.category, e.family_id, f.user_id
    FROM expenses e
    JOIN families f ON e.family_id = f.id
    WHERE e.category IS NOT NULL
  LOOP
    -- Try to find a family-level category with the same name
    SELECT c.id INTO family_category_id
    FROM categories c
    WHERE c.family_id = exp_rec.family_id
      AND c.is_budget_category = false
      AND EXISTS (
        SELECT 1 FROM categories c2 
        WHERE c2.id = exp_rec.category::UUID 
        AND LOWER(c2.name) = LOWER(c.name)
      )
    LIMIT 1;
    
    -- Update expense if family category found
    IF family_category_id IS NOT NULL AND family_category_id::text != exp_rec.category THEN
      UPDATE expenses 
      SET category = family_category_id::text
      WHERE id = exp_rec.expense_id;
      
      RAISE NOTICE 'Updated expense % to use family category %', exp_rec.expense_id, family_category_id;
    END IF;
  END LOOP;
END;
$$;

-- Step 2: Run the expense reference fix
SELECT fix_expense_category_references();

-- Step 3: Delete user-level categories that have family equivalents
CREATE OR REPLACE FUNCTION remove_duplicate_user_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_cat_rec RECORD;
BEGIN
  -- Find user-level categories that have family-level equivalents
  FOR user_cat_rec IN
    SELECT c1.id, c1.name, c1.user_id
    FROM categories c1
    WHERE c1.family_id IS NULL 
      AND c1.is_budget_category = false
      AND EXISTS (
        SELECT 1 FROM categories c2
        JOIN families f ON c2.family_id = f.id
        WHERE f.user_id = c1.user_id
          AND LOWER(c2.name) = LOWER(c1.name)
          AND c2.is_budget_category = false
      )
  LOOP
    -- Check if this category is still referenced by any expenses
    IF NOT EXISTS (SELECT 1 FROM expenses WHERE category = user_cat_rec.id::text) 
       AND NOT EXISTS (SELECT 1 FROM receipt_line_items WHERE category_id = user_cat_rec.id OR suggested_category_id = user_cat_rec.id) THEN
      
      -- Safe to delete
      DELETE FROM categories WHERE id = user_cat_rec.id;
      RAISE NOTICE 'Deleted duplicate user category: %', user_cat_rec.name;
    END IF;
  END LOOP;
END;
$$;

-- Step 4: Run the cleanup
SELECT remove_duplicate_user_categories();

-- Step 5: Clean up any remaining family-level duplicates
CREATE OR REPLACE FUNCTION clean_family_duplicates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dup_rec RECORD;
  keep_id UUID;
BEGIN
  -- Find family-level duplicates
  FOR dup_rec IN
    SELECT family_id, LOWER(name) as name_lower, array_agg(id ORDER BY created_at) as ids
    FROM categories
    WHERE family_id IS NOT NULL AND is_budget_category = false
    GROUP BY family_id, LOWER(name), COALESCE(parent_id::text, 'null')
    HAVING COUNT(*) > 1
  LOOP
    keep_id := dup_rec.ids[1];
    
    -- Update references and delete duplicates
    FOR i IN 2..array_length(dup_rec.ids, 1) LOOP
      -- Update expenses
      UPDATE expenses SET category = keep_id::text WHERE category = dup_rec.ids[i]::text;
      
      -- Update receipt items
      UPDATE receipt_line_items SET category_id = keep_id WHERE category_id = dup_rec.ids[i];
      UPDATE receipt_line_items SET suggested_category_id = keep_id WHERE suggested_category_id = dup_rec.ids[i];
      
      -- Delete duplicate
      DELETE FROM categories WHERE id = dup_rec.ids[i];
    END LOOP;
    
    RAISE NOTICE 'Cleaned family duplicates for: %', dup_rec.name_lower;
  END LOOP;
END;
$$;

-- Step 6: Run family cleanup
SELECT clean_family_duplicates();

-- Step 7: Drop temporary functions
DROP FUNCTION IF EXISTS fix_expense_category_references();
DROP FUNCTION IF EXISTS remove_duplicate_user_categories();
DROP FUNCTION IF EXISTS clean_family_duplicates();