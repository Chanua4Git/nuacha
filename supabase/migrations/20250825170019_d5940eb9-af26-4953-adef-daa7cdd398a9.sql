-- Comprehensive Category System Implementation
-- This migration seeds the complete hierarchical category structure

-- Function to seed comprehensive categories for a user
CREATE OR REPLACE FUNCTION seed_comprehensive_categories_for_user(user_uuid uuid, family_uuid uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  parent_id uuid;
  category_id uuid;
BEGIN
  -- 1. Housing & Utilities (Needs)
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Housing & Utilities', '#0EA5E9', 'needs', 1, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  -- Housing & Utilities children
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Rent / Mortgage', '#0EA5E9', 'needs', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Electricity', '#0EA5E9', 'needs', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Water & Sewer', '#0EA5E9', 'needs', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Gas', '#0EA5E9', 'needs', parent_id, 4, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Internet / Wi-Fi', '#0EA5E9', 'needs', parent_id, 5, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Mobile Phone Service', '#0EA5E9', 'needs', parent_id, 6, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Home Phone Service', '#0EA5E9', 'needs', parent_id, 7, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Cable / Streaming services', '#0EA5E9', 'wants', parent_id, 8, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Garbage collection', '#0EA5E9', 'needs', parent_id, 9, COALESCE(family_uuid IS NULL, false));

  -- 2. Caregiving & Medical (Needs)
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Caregiving & Medical', '#EF4444', 'needs', 2, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Day nurse', '#EF4444', 'needs', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Night nurse', '#EF4444', 'needs', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Nurse', '#EF4444', 'needs', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'WeekDay nurse', '#EF4444', 'needs', parent_id, 4, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Weekend Day Nurse', '#EF4444', 'needs', parent_id, 5, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Doctor visits', '#EF4444', 'needs', parent_id, 6, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Specialist visits', '#EF4444', 'needs', parent_id, 7, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Medical tests', '#EF4444', 'needs', parent_id, 8, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Medication', '#EF4444', 'needs', parent_id, 9, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Medical supplies', '#EF4444', 'needs', parent_id, 10, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Emotional Support / Mental Health', '#EF4444', 'needs', parent_id, 11, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Elderly Care / Support', '#EF4444', 'needs', parent_id, 12, COALESCE(family_uuid IS NULL, false));

  -- 3. Household Operations (Mixed)
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Household Operations', '#10B981', 'needs', 3, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Cleaning & Housekeeping', '#10B981', 'wants', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Housekeeper', '#10B981', 'wants', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Laundry', '#10B981', 'needs', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Care', '#10B981', 'needs', parent_id, 4, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Garden services', '#10B981', 'wants', parent_id, 5, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Yard', '#10B981', 'wants', parent_id, 6, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Pool maintenance', '#10B981', 'wants', parent_id, 7, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Pest control', '#10B981', 'needs', parent_id, 8, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Household repairs', '#10B981', 'needs', parent_id, 9, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Appliance repairs', '#10B981', 'needs', parent_id, 10, COALESCE(family_uuid IS NULL, false));

  -- 4. Groceries & Household Supplies (Needs)
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Groceries & Household Supplies', '#22C55E', 'needs', 4, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Groceries', '#22C55E', 'needs', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Fresh produce', '#22C55E', 'needs', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Meat & seafood', '#22C55E', 'needs', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Dairy & eggs', '#22C55E', 'needs', parent_id, 4, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Pantry staples', '#22C55E', 'needs', parent_id, 5, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Frozen foods', '#22C55E', 'needs', parent_id, 6, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Beverages', '#22C55E', 'needs', parent_id, 7, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Snacks & treats', '#22C55E', 'wants', parent_id, 8, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Special Dietary Needs (Formula, Baby Food)', '#22C55E', 'needs', parent_id, 9, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Cleaning supplies', '#22C55E', 'needs', parent_id, 10, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Kitchen supplies', '#22C55E', 'needs', parent_id, 11, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Bathroom supplies', '#22C55E', 'needs', parent_id, 12, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Toiletries', '#22C55E', 'needs', parent_id, 13, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Paper goods', '#22C55E', 'needs', parent_id, 14, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Pet food & supplies', '#22C55E', 'needs', parent_id, 15, COALESCE(family_uuid IS NULL, false));

  -- Continue with remaining categories...
  -- 5. Transportation (Needs)
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Transportation', '#F97316', 'needs', 5, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Fuel', '#F97316', 'needs', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Taxi / rideshare', '#F97316', 'needs', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Public transportation', '#F97316', 'needs', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Vehicle maintenance', '#F97316', 'needs', parent_id, 4, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Vehicle insurance', '#F97316', 'needs', parent_id, 5, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Vehicle loan payment', '#F97316', 'needs', parent_id, 6, COALESCE(family_uuid IS NULL, false));

  -- 6. Insurance & Financial
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Insurance & Financial', '#6366F1', 'needs', 6, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Health insurance', '#6366F1', 'needs', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Dental insurance', '#6366F1', 'needs', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Life insurance', '#6366F1', 'needs', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Home insurance', '#6366F1', 'needs', parent_id, 4, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Other insurance', '#6366F1', 'needs', parent_id, 5, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Loan repayments', '#6366F1', 'needs', parent_id, 6, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Student loan payments', '#6366F1', 'needs', parent_id, 7, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Minimum Debt', '#6366F1', 'needs', parent_id, 8, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Property taxes', '#6366F1', 'needs', parent_id, 9, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Bank fees', '#6366F1', 'needs', parent_id, 10, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Savings', '#6366F1', 'savings', parent_id, 11, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Investments', '#6366F1', 'savings', parent_id, 12, COALESCE(family_uuid IS NULL, false));

  -- 7. Personal Care & Wellness
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Personal Care & Wellness', '#EC4899', 'needs', 7, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Personal hygiene', '#EC4899', 'needs', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Vision care (glasses, contacts, exams)', '#EC4899', 'needs', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Skincare', '#EC4899', 'wants', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Makeup & cosmetics', '#EC4899', 'wants', parent_id, 4, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Haircuts & grooming', '#EC4899', 'wants', parent_id, 5, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Nail care', '#EC4899', 'wants', parent_id, 6, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Spa & massage', '#EC4899', 'wants', parent_id, 7, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Gym membership', '#EC4899', 'wants', parent_id, 8, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Fitness equipment', '#EC4899', 'wants', parent_id, 9, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Vitamins & supplements', '#EC4899', 'wants', parent_id, 10, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Dental care products', '#EC4899', 'needs', parent_id, 11, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Feminine products', '#EC4899', 'needs', parent_id, 12, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Men''s grooming', '#EC4899', 'needs', parent_id, 13, COALESCE(family_uuid IS NULL, false));

  -- 8. Education & Child Expenses
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Education & Child Expenses', '#8B5CF6', 'needs', 8, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'School fees', '#8B5CF6', 'needs', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'School lunches / meal programs', '#8B5CF6', 'needs', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'School transportation (bus fees)', '#8B5CF6', 'needs', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Books & stationery', '#8B5CF6', 'needs', parent_id, 4, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Extracurricular activities', '#8B5CF6', 'wants', parent_id, 5, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'School uniforms', '#8B5CF6', 'needs', parent_id, 6, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Childcare', '#8B5CF6', 'needs', parent_id, 7, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Tutoring & Homework Help', '#8B5CF6', 'wants', parent_id, 8, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Child food & snacks', '#8B5CF6', 'needs', parent_id, 9, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Child toiletries', '#8B5CF6', 'needs', parent_id, 10, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Child clothing', '#8B5CF6', 'needs', parent_id, 11, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Toys & games', '#8B5CF6', 'wants', parent_id, 12, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Child medical & dental', '#8B5CF6', 'needs', parent_id, 13, COALESCE(family_uuid IS NULL, false));

  -- 9. Entertainment & Leisure
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Entertainment & Leisure', '#F59E0B', 'wants', 9, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Dining out', '#F59E0B', 'wants', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Subscriptions', '#F59E0B', 'wants', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Events & tickets', '#F59E0B', 'wants', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Hobbies & crafts', '#F59E0B', 'wants', parent_id, 4, COALESCE(family_uuid IS NULL, false));

  -- 10. Gifts & Special Occasions
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Gifts & Special Occasions', '#EF4444', 'wants', 10, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Birthday gifts', '#EF4444', 'wants', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Holiday gifts', '#EF4444', 'wants', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Anniversaries', '#EF4444', 'wants', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Weddings & celebrations', '#EF4444', 'wants', parent_id, 4, COALESCE(family_uuid IS NULL, false));

  -- 11. Travel & Holidays
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Travel & Holidays', '#06B6D4', 'wants', 11, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Flights & transportation', '#06B6D4', 'wants', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Accommodation', '#06B6D4', 'wants', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Travel insurance', '#06B6D4', 'wants', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Activities & tours', '#06B6D4', 'wants', parent_id, 4, COALESCE(family_uuid IS NULL, false));

  -- 12. Clothing & Fashion
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Clothing & Fashion', '#A855F7', 'needs', 12, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Everyday clothing', '#A855F7', 'needs', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Work attire', '#A855F7', 'needs', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Undergarments & socks', '#A855F7', 'needs', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Shoes & footwear', '#A855F7', 'needs', parent_id, 4, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Outerwear & coats', '#A855F7', 'needs', parent_id, 5, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Formal wear', '#A855F7', 'wants', parent_id, 6, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Accessories', '#A855F7', 'wants', parent_id, 7, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Luxury fashion', '#A855F7', 'wants', parent_id, 8, COALESCE(family_uuid IS NULL, false));

  -- 13. Technology & Electronics
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Technology & Electronics', '#3B82F6', 'needs', 13, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Computer & laptop', '#3B82F6', 'wants', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Software & apps', '#3B82F6', 'wants', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Electronics & gadgets', '#3B82F6', 'wants', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Home appliances', '#3B82F6', 'needs', parent_id, 4, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Tech repairs', '#3B82F6', 'needs', parent_id, 5, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Gaming', '#3B82F6', 'wants', parent_id, 6, COALESCE(family_uuid IS NULL, false));

  -- 14. Miscellaneous
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Miscellaneous', '#64748B', 'needs', 14, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'Emergency expenses', '#64748B', 'needs', parent_id, 1, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Donations & charity', '#64748B', 'wants', parent_id, 2, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Legal fees', '#64748B', 'needs', parent_id, 3, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Professional services', '#64748B', 'needs', parent_id, 4, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Unplanned purchases', '#64748B', 'wants', parent_id, 5, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Pet Care', '#64748B', 'wants', parent_id, 6, COALESCE(family_uuid IS NULL, false)),
  (user_uuid, family_uuid, 'Other expenses', '#64748B', 'wants', parent_id, 7, COALESCE(family_uuid IS NULL, false));

  -- 15. Wants (Lifestyle)
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, sort_order, is_budget_category)
  VALUES (user_uuid, family_uuid, 'Wants (Lifestyle)', '#F97316', 'wants', 15, COALESCE(family_uuid IS NULL, false))
  RETURNING id INTO parent_id;
  
  INSERT INTO public.categories (user_id, family_id, name, color, group_type, parent_id, sort_order, is_budget_category) VALUES
  (user_uuid, family_uuid, 'General lifestyle wants', '#F97316', 'wants', parent_id, 1, COALESCE(family_uuid IS NULL, false));

  RAISE NOTICE 'Comprehensive categories seeded for user %', user_uuid;
END;
$function$;

-- Function to seed categories for all user families
CREATE OR REPLACE FUNCTION seed_user_comprehensive_categories(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  family_rec RECORD;
BEGIN
  -- Seed budget categories (family_id = NULL)
  PERFORM seed_comprehensive_categories_for_user(user_uuid, NULL);
  
  -- Seed family-specific categories for each family
  FOR family_rec IN 
    SELECT id, name FROM public.families 
    WHERE user_id = user_uuid
  LOOP
    PERFORM seed_comprehensive_categories_for_user(user_uuid, family_rec.id);
    RAISE NOTICE 'Seeded categories for family: %', family_rec.name;
  END LOOP;
END;
$function$;