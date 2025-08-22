-- Robust duplicate cleanup focusing on updating references and removing dupes safely

-- 1) Fix expenses and receipt line items to use family-level categories by name
CREATE OR REPLACE FUNCTION fix_expense_and_receipt_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exp_rec RECORD;
  rli_rec RECORD;
  cat_name TEXT;
  family_cat_id UUID;
BEGIN
  -- Update expenses.category to family-level category id when possible
  FOR exp_rec IN
    SELECT e.id, e.category, e.family_id
    FROM expenses e
  LOOP
    cat_name := NULL;
    -- If category looks like a UUID and exists, get its name; otherwise treat as name
    IF exp_rec.category ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      SELECT name INTO cat_name FROM categories WHERE id = exp_rec.category::uuid LIMIT 1;
      IF cat_name IS NULL THEN
        cat_name := exp_rec.category; -- fallback to raw text
      END IF;
    ELSE
      cat_name := exp_rec.category;
    END IF;

    IF cat_name IS NULL THEN CONTINUE; END IF;

    -- Find a family-level category with the same name
    SELECT id INTO family_cat_id
    FROM categories
    WHERE family_id = exp_rec.family_id
      AND is_budget_category = false
      AND LOWER(name) = LOWER(cat_name)
    ORDER BY created_at ASC
    LIMIT 1;

    -- Update expense to reference the family-level category id as text
    IF family_cat_id IS NOT NULL THEN
      UPDATE expenses SET category = family_cat_id::text WHERE id = exp_rec.id;
    END IF;
  END LOOP;

  -- Update receipt_line_items category_id to family-level equivalent by name within the expense's family
  FOR rli_rec IN
    SELECT r.id as rli_id, r.category_id, r.suggested_category_id, e.family_id,
           (SELECT name FROM categories WHERE id = r.category_id) as cat_name_curr,
           (SELECT name FROM categories WHERE id = r.suggested_category_id) as sugg_name
    FROM receipt_line_items r
    JOIN expenses e ON e.id = r.expense_id
  LOOP
    -- category_id
    IF rli_rec.category_id IS NOT NULL AND rli_rec.cat_name_curr IS NOT NULL THEN
      SELECT id INTO family_cat_id
      FROM categories
      WHERE family_id = rli_rec.family_id
        AND is_budget_category = false
        AND LOWER(name) = LOWER(rli_rec.cat_name_curr)
      ORDER BY created_at ASC
      LIMIT 1;

      IF family_cat_id IS NOT NULL AND family_cat_id <> rli_rec.category_id THEN
        UPDATE receipt_line_items SET category_id = family_cat_id WHERE id = rli_rec.rli_id;
      END IF;
    END IF;

    -- suggested_category_id
    IF rli_rec.suggested_category_id IS NOT NULL AND rli_rec.sugg_name IS NOT NULL THEN
      SELECT id INTO family_cat_id
      FROM categories
      WHERE family_id = rli_rec.family_id
        AND is_budget_category = false
        AND LOWER(name) = LOWER(rli_rec.sugg_name)
      ORDER BY created_at ASC
      LIMIT 1;

      IF family_cat_id IS NOT NULL AND family_cat_id <> rli_rec.suggested_category_id THEN
        UPDATE receipt_line_items SET suggested_category_id = family_cat_id WHERE id = rli_rec.rli_id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

SELECT fix_expense_and_receipt_categories();

-- 2) Remove unreferenced user-level (non-budget) categories that have family equivalents
CREATE OR REPLACE FUNCTION purge_unreferenced_user_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cat_rec RECORD;
  has_family_equivalent BOOLEAN;
BEGIN
  FOR cat_rec IN
    SELECT * FROM categories c
    WHERE c.family_id IS NULL AND c.is_budget_category = false
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM categories c2
      JOIN families f ON f.id = c2.family_id
      WHERE f.user_id = cat_rec.user_id
        AND c2.is_budget_category = false
        AND LOWER(c2.name) = LOWER(cat_rec.name)
    ) INTO has_family_equivalent;

    IF has_family_equivalent
       AND NOT EXISTS (SELECT 1 FROM expenses WHERE category = cat_rec.id::text)
       AND NOT EXISTS (SELECT 1 FROM receipt_line_items WHERE category_id = cat_rec.id OR suggested_category_id = cat_rec.id) THEN
      DELETE FROM categories WHERE id = cat_rec.id;
    END IF;
  END LOOP;
END;
$$;

SELECT purge_unreferenced_user_categories();

-- 3) Merge remaining family-level duplicates by name (ignore differing parents)
CREATE OR REPLACE FUNCTION merge_family_duplicates_by_name()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dup RECORD;
  keep UUID;
BEGIN
  FOR dup IN
    SELECT family_id, LOWER(name) AS lname, array_agg(id ORDER BY created_at) AS ids
    FROM categories
    WHERE family_id IS NOT NULL AND is_budget_category = false
    GROUP BY family_id, LOWER(name)
    HAVING COUNT(*) > 1
  LOOP
    keep := dup.ids[1];
    -- Repoint all references to the kept id
    FOR i IN 2..array_length(dup.ids,1) LOOP
      UPDATE expenses SET category = keep::text WHERE category = dup.ids[i]::text;
      UPDATE receipt_line_items SET category_id = keep WHERE category_id = dup.ids[i];
      UPDATE receipt_line_items SET suggested_category_id = keep WHERE suggested_category_id = dup.ids[i];
      UPDATE categories SET parent_id = keep WHERE parent_id = dup.ids[i];
      DELETE FROM categories WHERE id = dup.ids[i];
    END LOOP;
  END LOOP;
END;
$$;

SELECT merge_family_duplicates_by_name();

-- 4) Drop helper functions
DROP FUNCTION IF EXISTS fix_expense_and_receipt_categories();
DROP FUNCTION IF EXISTS purge_unreferenced_user_categories();
DROP FUNCTION IF EXISTS merge_family_duplicates_by_name();