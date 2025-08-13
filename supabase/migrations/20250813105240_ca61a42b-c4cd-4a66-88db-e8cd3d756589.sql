-- Unified Category System Migration
-- Phase 1: Add necessary fields to categories table for budget functionality

-- Add missing columns to categories table if they don't exist
DO $$
BEGIN
    -- Add group_type column for budget categorization (needs, wants, savings)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='group_type') THEN
        ALTER TABLE public.categories ADD COLUMN group_type text;
    END IF;
    
    -- Add user_id column for user-specific budget categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='user_id') THEN
        ALTER TABLE public.categories ADD COLUMN user_id uuid;
    END IF;
    
    -- Add sort_order column for custom ordering
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='sort_order') THEN
        ALTER TABLE public.categories ADD COLUMN sort_order integer DEFAULT 0;
    END IF;
    
    -- Add is_budget_category flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='is_budget_category') THEN
        ALTER TABLE public.categories ADD COLUMN is_budget_category boolean DEFAULT false;
    END IF;
END $$;

-- Migrate existing budget_categories to the unified categories table
INSERT INTO public.categories (
    name, 
    color, 
    family_id, 
    user_id, 
    group_type, 
    sort_order, 
    is_budget_category
)
SELECT 
    bc.name,
    CASE bc.group_type
        WHEN 'needs' THEN '#EF4444'     -- Red for needs
        WHEN 'wants' THEN '#F97316'     -- Orange for wants  
        WHEN 'savings' THEN '#22C55E'   -- Green for savings
        ELSE '#6B7280'                  -- Gray default
    END as color,
    NULL as family_id,                  -- Budget categories are user-level, not family-level
    bc.user_id,
    bc.group_type,
    bc.sort_order,
    true as is_budget_category
FROM public.budget_categories bc
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c 
    WHERE c.name = bc.name 
    AND c.user_id = bc.user_id 
    AND c.is_budget_category = true
);

-- Update RLS policies for categories table to handle user-specific budget categories
DROP POLICY IF EXISTS "Users can view their categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their categories" ON public.categories;

-- New unified RLS policies for categories
CREATE POLICY "Users can view their categories" ON public.categories
FOR SELECT USING (
    -- Family-specific categories: user owns the family
    (family_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM families f WHERE f.id = categories.family_id AND f.user_id = auth.uid()
    ))
    OR
    -- User-specific budget categories: user owns the category
    (family_id IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Users can insert their categories" ON public.categories
FOR INSERT WITH CHECK (
    -- Family-specific categories: user owns the family
    (family_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM families f WHERE f.id = categories.family_id AND f.user_id = auth.uid()
    ))
    OR
    -- User-specific budget categories: user owns the category
    (family_id IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Users can update their categories" ON public.categories
FOR UPDATE USING (
    -- Family-specific categories: user owns the family
    (family_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM families f WHERE f.id = categories.family_id AND f.user_id = auth.uid()
    ))
    OR
    -- User-specific budget categories: user owns the category
    (family_id IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Users can delete their categories" ON public.categories
FOR DELETE USING (
    -- Family-specific categories: user owns the family
    (family_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM families f WHERE f.id = categories.family_id AND f.user_id = auth.uid()
    ))
    OR
    -- User-specific budget categories: user owns the category
    (family_id IS NULL AND user_id = auth.uid())
);

-- Create index for better performance on user_id queries
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_group_type ON public.categories(group_type);
CREATE INDEX IF NOT EXISTS idx_categories_is_budget_category ON public.categories(is_budget_category);

-- Create function to ensure users have default budget categories
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