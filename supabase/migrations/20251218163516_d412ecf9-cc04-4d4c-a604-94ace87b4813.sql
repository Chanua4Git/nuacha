-- Create scan_usage table for server-side scan limit tracking
CREATE TABLE public.scan_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address INET,
  scan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scan_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (email, scan_date)
);

-- Enable RLS
ALTER TABLE public.scan_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own scan usage
CREATE POLICY "Users can view their own scan usage"
ON public.scan_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR email = (auth.jwt() ->> 'email'));

-- Policy: Anyone can insert scan usage (for anonymous users)
CREATE POLICY "Anyone can insert scan usage"
ON public.scan_usage
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Anyone can update scan usage (for incrementing counts)
CREATE POLICY "Anyone can update scan usage"
ON public.scan_usage
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy: Service role full access for edge functions
CREATE POLICY "Service role full access to scan_usage"
ON public.scan_usage
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.scan_usage TO anon;
GRANT SELECT, INSERT, UPDATE ON public.scan_usage TO authenticated;
GRANT ALL ON public.scan_usage TO service_role;

-- Create index for fast lookups
CREATE INDEX idx_scan_usage_email_date ON public.scan_usage(email, scan_date);
CREATE INDEX idx_scan_usage_user_id ON public.scan_usage(user_id);

-- Create function to get or increment scan count
CREATE OR REPLACE FUNCTION public.increment_scan_count(
  p_email TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS TABLE(current_count INTEGER, is_allowed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_limit INTEGER := 3; -- Free tier daily limit
  v_has_subscription BOOLEAN := false;
BEGIN
  -- Check if user has active subscription
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM subscription_orders
      WHERE user_id = p_user_id
      AND status = 'active'
    ) INTO v_has_subscription;
  END IF;
  
  -- If user doesn't have subscription by user_id, check by email
  IF NOT v_has_subscription AND p_email IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM subscription_orders
      WHERE customer_email = p_email
      AND status = 'active'
    ) INTO v_has_subscription;
  END IF;
  
  -- If subscribed, allow unlimited
  IF v_has_subscription THEN
    -- Still track for analytics but always allow
    INSERT INTO scan_usage (email, user_id, ip_address, scan_date, scan_count)
    VALUES (p_email, p_user_id, p_ip_address, CURRENT_DATE, 1)
    ON CONFLICT (email, scan_date)
    DO UPDATE SET 
      scan_count = scan_usage.scan_count + 1,
      updated_at = now(),
      user_id = COALESCE(EXCLUDED.user_id, scan_usage.user_id);
    
    SELECT scan_count INTO v_count FROM scan_usage 
    WHERE email = p_email AND scan_date = CURRENT_DATE;
    
    RETURN QUERY SELECT v_count, true;
    RETURN;
  END IF;
  
  -- For free users, check and enforce limit
  -- First, get current count
  SELECT scan_count INTO v_count FROM scan_usage
  WHERE email = p_email AND scan_date = CURRENT_DATE;
  
  IF v_count IS NULL THEN
    -- First scan of the day
    INSERT INTO scan_usage (email, user_id, ip_address, scan_date, scan_count)
    VALUES (p_email, p_user_id, p_ip_address, CURRENT_DATE, 1);
    RETURN QUERY SELECT 1, true;
  ELSIF v_count < v_limit THEN
    -- Under limit, increment
    UPDATE scan_usage 
    SET scan_count = scan_count + 1, 
        updated_at = now(),
        user_id = COALESCE(p_user_id, user_id)
    WHERE email = p_email AND scan_date = CURRENT_DATE;
    RETURN QUERY SELECT v_count + 1, true;
  ELSE
    -- At or over limit
    RETURN QUERY SELECT v_count, false;
  END IF;
END;
$$;

-- Create function to check scan usage without incrementing
CREATE OR REPLACE FUNCTION public.get_scan_usage(
  p_email TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(current_count INTEGER, daily_limit INTEGER, has_subscription BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_has_subscription BOOLEAN := false;
BEGIN
  -- Check if user has active subscription
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM subscription_orders
      WHERE user_id = p_user_id
      AND status = 'active'
    ) INTO v_has_subscription;
  END IF;
  
  -- If user doesn't have subscription by user_id, check by email
  IF NOT v_has_subscription AND p_email IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM subscription_orders
      WHERE customer_email = p_email
      AND status = 'active'
    ) INTO v_has_subscription;
  END IF;
  
  -- Get current count
  SELECT scan_count INTO v_count FROM scan_usage
  WHERE email = p_email AND scan_date = CURRENT_DATE;
  
  RETURN QUERY SELECT COALESCE(v_count, 0), 3, v_has_subscription;
END;
$$;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.increment_scan_count TO anon;
GRANT EXECUTE ON FUNCTION public.increment_scan_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scan_usage TO anon;
GRANT EXECUTE ON FUNCTION public.get_scan_usage TO authenticated;