-- Drop the insecure view that exposes auth.users
DROP VIEW IF EXISTS public.admin_dashboard_stats;

-- Create a secure function instead of a view
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Only allow admins
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'active_vehicles', (SELECT COUNT(*) FROM public.vehicles WHERE is_active = true),
    'trips_today', (SELECT COUNT(*) FROM public.trips WHERE created_at > now() - interval '24 hours'),
    'revenue_today', (SELECT COALESCE(SUM(fare), 0) FROM public.trips WHERE created_at > now() - interval '24 hours'),
    'total_fleet_owners', (SELECT COUNT(*) FROM public.fleet_owners WHERE is_active = true),
    'pending_reservations', (SELECT COUNT(*) FROM public.scheduled_trips WHERE status = 'pending'),
    'total_drivers', (SELECT COUNT(DISTINCT driver_id) FROM public.vehicles WHERE driver_id IS NOT NULL),
    'active_trips', (SELECT COUNT(*) FROM public.trips WHERE status IN ('active', 'in_progress'))
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get all users for admin
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.phone_number,
    p.avatar_url,
    p.created_at,
    ARRAY_AGG(ur.role::TEXT) FILTER (WHERE ur.role IS NOT NULL) as roles
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  GROUP BY p.id, p.first_name, p.last_name, p.phone_number, p.avatar_url, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get all vehicles for admin
CREATE OR REPLACE FUNCTION public.admin_get_vehicles()
RETURNS TABLE(
  id UUID,
  plate_number TEXT,
  vehicle_type TEXT,
  status TEXT,
  driver_id UUID,
  driver_name TEXT,
  destination TEXT,
  current_passengers INT,
  capacity INT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    v.id,
    v.plate_number,
    v.vehicle_type,
    v.status,
    v.driver_id,
    CONCAT(p.first_name, ' ', p.last_name) as driver_name,
    v.destination,
    v.current_passengers,
    v.capacity,
    v.is_active,
    v.created_at
  FROM public.vehicles v
  LEFT JOIN public.profiles p ON v.driver_id = p.id
  ORDER BY v.created_at DESC;
END;
$$;

-- Function to get all trips for admin
CREATE OR REPLACE FUNCTION public.admin_get_trips(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_name TEXT,
  origin TEXT,
  destination TEXT,
  fare INT,
  status TEXT,
  trip_type TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    CONCAT(p.first_name, ' ', p.last_name) as user_name,
    t.origin,
    t.destination,
    t.fare,
    t.status,
    t.trip_type,
    t.created_at,
    t.completed_at
  FROM public.trips t
  LEFT JOIN public.profiles p ON t.user_id = p.id
  ORDER BY t.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Admin function to assign roles
CREATE OR REPLACE FUNCTION public.admin_assign_role(p_user_id UUID, p_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Admin function to remove roles
CREATE OR REPLACE FUNCTION public.admin_remove_role(p_user_id UUID, p_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  DELETE FROM public.user_roles 
  WHERE user_id = p_user_id AND role = p_role;
  
  RETURN TRUE;
END;
$$;