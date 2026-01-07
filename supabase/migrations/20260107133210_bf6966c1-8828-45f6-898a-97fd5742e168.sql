-- Fix 1: Deny direct wallet creation (wallets should only be created via trigger)
CREATE POLICY "Deny direct wallet creation" 
ON public.wallets FOR INSERT 
WITH CHECK (false);

-- Fix 2: Add WITH CHECK clauses to UPDATE policies to prevent ownership changes

-- Profiles: Drop and recreate with WITH CHECK
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Wallets: Drop and recreate with WITH CHECK
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallets;
CREATE POLICY "Users can update their own wallet"
ON public.wallets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Notifications: Drop and recreate with WITH CHECK
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Favorite stops: Drop and recreate with WITH CHECK
DROP POLICY IF EXISTS "Users can update their favorite stops" ON public.favorite_stops;
CREATE POLICY "Users can update their favorite stops"
ON public.favorite_stops FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Transport budgets: Drop and recreate with WITH CHECK
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.transport_budgets;
CREATE POLICY "Users can update their own budgets"
ON public.transport_budgets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Nearby contacts: Drop and recreate with WITH CHECK
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.nearby_contacts;
CREATE POLICY "Users can update their own contacts"
ON public.nearby_contacts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User addresses: Drop and recreate with WITH CHECK (was already in schema but let's ensure)
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.user_addresses;
CREATE POLICY "Users can update their own addresses"
ON public.user_addresses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 3: Add server-side validation for client signals via RPC function
CREATE OR REPLACE FUNCTION public.create_client_signal(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_people_count INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_signal_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user (can be null for anonymous)
  v_user_id := auth.uid();
  
  -- Validate people count (1-10)
  IF p_people_count < 1 OR p_people_count > 10 THEN
    RAISE EXCEPTION 'Invalid people count: must be between 1 and 10';
  END IF;
  
  -- Validate coordinates are reasonable (Douala/Cameroon region: lat 3.5-5.0, lng 9.0-10.5)
  IF p_latitude < 3.5 OR p_latitude > 5.0 OR p_longitude < 9.0 OR p_longitude > 10.5 THEN
    RAISE EXCEPTION 'Location outside service area';
  END IF;
  
  -- Rate limit: max 1 signal per minute per user (for authenticated users)
  IF v_user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM client_signals 
    WHERE user_id = v_user_id 
    AND created_at > now() - interval '1 minute'
  ) THEN
    RAISE EXCEPTION 'Please wait before creating another signal';
  END IF;
  
  -- Insert the signal
  INSERT INTO client_signals (user_id, latitude, longitude, people_count)
  VALUES (v_user_id, p_latitude, p_longitude, p_people_count)
  RETURNING id INTO v_signal_id;
  
  RETURN v_signal_id;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.create_client_signal TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_client_signal TO anon;