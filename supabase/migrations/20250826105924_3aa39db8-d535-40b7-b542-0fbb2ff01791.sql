
-- 1) Safe overload to handle single-argument calls (avoids "unknown" type for NULL)
CREATE OR REPLACE FUNCTION public.seed_comprehensive_categories_for_user(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Delegate to the two-argument version, explicitly casting NULL to uuid
  PERFORM public.seed_comprehensive_categories_for_user(user_uuid, NULL::uuid);
END;
$function$;

-- 2) Wrapper to seed user-level and every family for that user
CREATE OR REPLACE FUNCTION public.seed_user_comprehensive_categories(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  fam RECORD;
BEGIN
  -- Seed user-level categories (no family)
  PERFORM public.seed_comprehensive_categories_for_user(user_uuid, NULL::uuid);

  -- Seed categories for each family owned by this user
  FOR fam IN
    SELECT id FROM public.families WHERE user_id = user_uuid
  LOOP
    PERFORM public.seed_comprehensive_categories_for_user(user_uuid, fam.id);
  END LOOP;
END;
$function$;

-- 3) Ensure the app can call these functions
GRANT EXECUTE ON FUNCTION public.seed_comprehensive_categories_for_user(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_user_comprehensive_categories(uuid) TO anon, authenticated;
