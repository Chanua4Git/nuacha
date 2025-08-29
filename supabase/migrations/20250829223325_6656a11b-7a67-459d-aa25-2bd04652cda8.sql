-- Final comprehensive cleanup of all duplicate categories
-- This will ensure each user has only one category per name to fix smart categorization

-- Clean up duplicate categories for each user, keeping the oldest one
DO $$
DECLARE
    user_rec RECORD;
    cat_rec RECORD;
    keep_category_id UUID;
BEGIN
    -- For each user, clean up duplicate categories
    FOR user_rec IN 
        SELECT DISTINCT user_id 
        FROM public.categories 
        WHERE user_id IS NOT NULL
    LOOP
        -- Clean up user-level categories (family_id IS NULL)
        FOR cat_rec IN 
            SELECT LOWER(name) as name_lower, COUNT(*) as cnt, array_agg(id ORDER BY created_at) as category_ids
            FROM public.categories 
            WHERE user_id = user_rec.user_id 
              AND family_id IS NULL
            GROUP BY LOWER(name)
            HAVING COUNT(*) > 1
        LOOP
            -- Keep the first (oldest) category
            keep_category_id := cat_rec.category_ids[1];
            
            -- Update all references to point to the kept category
            FOR i IN 2..array_length(cat_rec.category_ids, 1) LOOP
                -- Update expenses that reference the duplicate category as regular category
                UPDATE public.expenses 
                SET category = keep_category_id::text 
                WHERE category = cat_rec.category_ids[i]::text;
                
                -- Update expenses that reference the duplicate category as budget category
                UPDATE public.expenses 
                SET budget_category_id = keep_category_id 
                WHERE budget_category_id = cat_rec.category_ids[i];
                
                -- Update receipt line items  
                UPDATE public.receipt_line_items 
                SET category_id = keep_category_id 
                WHERE category_id = cat_rec.category_ids[i];
                
                UPDATE public.receipt_line_items 
                SET suggested_category_id = keep_category_id 
                WHERE suggested_category_id = cat_rec.category_ids[i];
                
                -- Update budgets that reference the duplicate category
                UPDATE public.budgets 
                SET category_id = keep_category_id 
                WHERE category_id = cat_rec.category_ids[i];
                
                -- Update categorization rules
                UPDATE public.categorization_rules 
                SET category_id = keep_category_id 
                WHERE category_id = cat_rec.category_ids[i];
                
                -- Update child categories to point to new parent
                UPDATE public.categories 
                SET parent_id = keep_category_id 
                WHERE parent_id = cat_rec.category_ids[i];
                
                -- Delete the duplicate category
                DELETE FROM public.categories WHERE id = cat_rec.category_ids[i];
                
                RAISE NOTICE 'Cleaned up duplicate category % for user %', cat_rec.name_lower, user_rec.user_id;
            END LOOP;
        END LOOP;
        
        -- Clean up family-level category duplicates  
        FOR cat_rec IN 
            SELECT family_id, LOWER(name) as name_lower, COUNT(*) as cnt, array_agg(id ORDER BY created_at) as category_ids
            FROM public.categories 
            WHERE user_id = user_rec.user_id 
              AND family_id IS NOT NULL
            GROUP BY family_id, LOWER(name)
            HAVING COUNT(*) > 1
        LOOP
            -- Keep the first (oldest) category
            keep_category_id := cat_rec.category_ids[1];
            
            -- Update all references to point to the kept category
            FOR i IN 2..array_length(cat_rec.category_ids, 1) LOOP
                -- Update expenses that reference the duplicate category as regular category
                UPDATE public.expenses 
                SET category = keep_category_id::text 
                WHERE category = cat_rec.category_ids[i]::text;
                
                -- Update receipt line items  
                UPDATE public.receipt_line_items 
                SET category_id = keep_category_id 
                WHERE category_id = cat_rec.category_ids[i];
                
                UPDATE public.receipt_line_items 
                SET suggested_category_id = keep_category_id 
                WHERE suggested_category_id = cat_rec.category_ids[i];
                
                -- Update child categories to point to new parent
                UPDATE public.categories 
                SET parent_id = keep_category_id 
                WHERE parent_id = cat_rec.category_ids[i];
                
                -- Delete the duplicate category
                DELETE FROM public.categories WHERE id = cat_rec.category_ids[i];
                
                RAISE NOTICE 'Cleaned up duplicate family category % for user %', cat_rec.name_lower, user_rec.user_id;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Ensure all users have essential categories
INSERT INTO public.categories (user_id, name, color, group_type, is_budget_category, sort_order)
SELECT DISTINCT 
    u.user_id, 
    'Groceries', 
    '#22C55E', 
    'needs', 
    true, 
    30
FROM (
    SELECT DISTINCT user_id FROM public.families WHERE user_id IS NOT NULL
) u
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c 
    WHERE c.user_id = u.user_id 
      AND c.family_id IS NULL 
      AND LOWER(c.name) = 'groceries'
);

INSERT INTO public.categories (user_id, name, color, group_type, is_budget_category, sort_order)
SELECT DISTINCT 
    u.user_id, 
    'Dining out', 
    '#F97316', 
    'wants', 
    true, 
    80
FROM (
    SELECT DISTINCT user_id FROM public.families WHERE user_id IS NOT NULL
) u
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c 
    WHERE c.user_id = u.user_id 
      AND c.family_id IS NULL 
      AND LOWER(c.name) = 'dining out'
);