CREATE OR REPLACE FUNCTION public.get_scan_usage(p_email text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(current_count integer, daily_limit integer, has_subscription boolean)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_count INTEGER; v_has BOOLEAN := false;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM subscription_orders WHERE user_id = p_user_id AND status = 'active')
        OR public.has_role(p_user_id, 'admin') INTO v_has;
  END IF;
  IF NOT v_has AND p_email IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM subscription_orders WHERE customer_email = p_email AND status = 'active') INTO v_has;
  END IF;
  SELECT scan_count INTO v_count FROM scan_usage WHERE email = p_email AND scan_date = CURRENT_DATE;
  RETURN QUERY SELECT COALESCE(v_count, 0), 0, v_has;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_scan_count(p_email text, p_user_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet)
 RETURNS TABLE(current_count integer, is_allowed boolean)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_count INTEGER; v_has BOOLEAN := false;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM subscription_orders WHERE user_id = p_user_id AND status = 'active')
        OR public.has_role(p_user_id, 'admin') INTO v_has;
  END IF;
  IF NOT v_has AND p_email IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM subscription_orders WHERE customer_email = p_email AND status = 'active') INTO v_has;
  END IF;
  IF NOT v_has THEN
    SELECT scan_count INTO v_count FROM scan_usage WHERE email = p_email AND scan_date = CURRENT_DATE;
    RETURN QUERY SELECT COALESCE(v_count, 0), false;
    RETURN;
  END IF;
  INSERT INTO scan_usage (email, user_id, ip_address, scan_date, scan_count)
  VALUES (p_email, p_user_id, p_ip_address, CURRENT_DATE, 1)
  ON CONFLICT (email, scan_date) DO UPDATE SET scan_count = scan_usage.scan_count + 1, updated_at = now(), user_id = COALESCE(EXCLUDED.user_id, scan_usage.user_id);
  SELECT scan_count INTO v_count FROM scan_usage WHERE email = p_email AND scan_date = CURRENT_DATE;
  RETURN QUERY SELECT v_count, true;
END;
$function$;