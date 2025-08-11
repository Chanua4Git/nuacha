-- Drop the existing function and recreate with the new category structure
DROP FUNCTION IF EXISTS public.create_default_budget_categories(uuid);

CREATE OR REPLACE FUNCTION public.create_default_budget_categories(user_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Insert Housing & Utilities (Needs)
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'needs', 'Rent / Mortgage', 1),
  (user_uuid, 'needs', 'Electricity', 2),
  (user_uuid, 'needs', 'Water & Sewer', 3),
  (user_uuid, 'needs', 'Gas', 4),
  (user_uuid, 'needs', 'Internet / Wi-Fi', 5),
  (user_uuid, 'wants', 'Cable / Streaming services', 6),
  (user_uuid, 'needs', 'Garbage collection', 7);

  -- Insert Caregiving & Medical (Needs)
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'needs', 'Day nurse', 10),
  (user_uuid, 'needs', 'Night nurse', 11),
  (user_uuid, 'needs', 'Doctor visits', 12),
  (user_uuid, 'needs', 'Specialist visits', 13),
  (user_uuid, 'needs', 'Medical tests', 14),
  (user_uuid, 'needs', 'Medication', 15),
  (user_uuid, 'needs', 'Medical supplies', 16);

  -- Insert Household Operations (Mixed)
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'wants', 'Housekeeper', 20),
  (user_uuid, 'wants', 'Garden services', 21),
  (user_uuid, 'wants', 'Pool maintenance', 22),
  (user_uuid, 'needs', 'Pest control', 23),
  (user_uuid, 'needs', 'Laundry', 24),
  (user_uuid, 'needs', 'Household repairs', 25),
  (user_uuid, 'needs', 'Appliance repairs', 26);

  -- Insert Groceries & Household Supplies (Needs)
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'needs', 'Groceries', 30),
  (user_uuid, 'needs', 'Pet food & supplies', 31),
  (user_uuid, 'needs', 'Toiletries', 32),
  (user_uuid, 'needs', 'Paper goods', 33);

  -- Insert Transportation (Needs)
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'needs', 'Fuel', 40),
  (user_uuid, 'needs', 'Taxi / rideshare', 41),
  (user_uuid, 'needs', 'Public transportation', 42),
  (user_uuid, 'needs', 'Vehicle maintenance', 43),
  (user_uuid, 'needs', 'Vehicle insurance', 44),
  (user_uuid, 'needs', 'Vehicle loan payment', 45);

  -- Insert Insurance & Financial (Needs/Savings)
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'needs', 'Health insurance', 50),
  (user_uuid, 'needs', 'Life insurance', 51),
  (user_uuid, 'needs', 'Home insurance', 52),
  (user_uuid, 'needs', 'Other insurance', 53),
  (user_uuid, 'needs', 'Loan repayments', 54),
  (user_uuid, 'savings', 'Savings', 55),
  (user_uuid, 'savings', 'Investments', 56);

  -- Insert Personal Care & Wellness (Wants)
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'wants', 'Haircuts & grooming', 60),
  (user_uuid, 'wants', 'Spa & massage', 61),
  (user_uuid, 'wants', 'Gym membership', 62),
  (user_uuid, 'wants', 'Vitamins & supplements', 63);

  -- Insert Education & Child Expenses (Needs)
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'needs', 'School fees', 70),
  (user_uuid, 'needs', 'Books & stationery', 71),
  (user_uuid, 'wants', 'Extracurricular activities', 72),
  (user_uuid, 'needs', 'School uniforms', 73),
  (user_uuid, 'needs', 'Childcare', 74);

  -- Insert Entertainment & Leisure (Wants)
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'wants', 'Dining out', 80),
  (user_uuid, 'wants', 'Subscriptions', 81),
  (user_uuid, 'wants', 'Events & tickets', 82),
  (user_uuid, 'wants', 'Hobbies & crafts', 83);

  -- Insert Gifts & Special Occasions (Wants)
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'wants', 'Birthday gifts', 90),
  (user_uuid, 'wants', 'Holiday gifts', 91),
  (user_uuid, 'wants', 'Anniversaries', 92),
  (user_uuid, 'wants', 'Weddings & celebrations', 93);

  -- Insert Travel & Holidays (Wants)
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'wants', 'Flights & transportation', 100),
  (user_uuid, 'wants', 'Accommodation', 101),
  (user_uuid, 'wants', 'Travel insurance', 102),
  (user_uuid, 'wants', 'Activities & tours', 103);

  -- Insert Miscellaneous (Various)
  INSERT INTO public.budget_categories (user_id, group_type, name, sort_order) VALUES
  (user_uuid, 'needs', 'Emergency expenses', 110),
  (user_uuid, 'wants', 'Donations & charity', 111),
  (user_uuid, 'needs', 'Legal fees', 112),
  (user_uuid, 'needs', 'Bank fees', 113),
  (user_uuid, 'wants', 'Unplanned purchases', 114);

  -- Insert default 50/30/20 rule if it doesn't exist
  INSERT INTO public.budget_allocations (user_id, rule_name, needs_pct, wants_pct, savings_pct, is_default)
  VALUES (user_uuid, '50/30/20 Rule', 50, 30, 20, true)
  ON CONFLICT DO NOTHING;
END;
$function$;