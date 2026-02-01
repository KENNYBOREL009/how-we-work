
-- Admin functions for complete system control

-- Get fleet owners with stats
CREATE OR REPLACE FUNCTION public.admin_get_fleet_owners()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  company_name text,
  contact_email text,
  contact_phone text,
  is_verified boolean,
  is_active boolean,
  vehicle_count bigint,
  driver_count bigint,
  created_at timestamp with time zone
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
    fo.id,
    fo.user_id,
    fo.company_name,
    fo.contact_email,
    fo.contact_phone,
    fo.is_verified,
    fo.is_active,
    COUNT(DISTINCT fv.id) as vehicle_count,
    COUNT(DISTINCT da.driver_id) as driver_count,
    fo.created_at
  FROM public.fleet_owners fo
  LEFT JOIN public.fleet_vehicles fv ON fo.id = fv.fleet_owner_id
  LEFT JOIN public.driver_assignments da ON fv.id = da.fleet_vehicle_id AND da.is_active = true
  GROUP BY fo.id
  ORDER BY fo.created_at DESC;
END;
$$;

-- Get bus routes with stats
CREATE OR REPLACE FUNCTION public.admin_get_bus_routes()
RETURNS TABLE(
  id uuid,
  name text,
  route_number text,
  start_point text,
  end_point text,
  color text,
  is_active boolean,
  stops_count bigint,
  schedules_count bigint
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
    br.id,
    br.name,
    br.route_number,
    br.start_point,
    br.end_point,
    br.color,
    br.is_active,
    COUNT(DISTINCT rs.id) as stops_count,
    COUNT(DISTINCT bs.id) as schedules_count
  FROM public.bus_routes br
  LEFT JOIN public.route_stops rs ON br.id = rs.route_id
  LEFT JOIN public.bus_schedules bs ON br.id = bs.route_id
  GROUP BY br.id
  ORDER BY br.name;
END;
$$;

-- Get bus stops
CREATE OR REPLACE FUNCTION public.admin_get_bus_stops()
RETURNS TABLE(
  id uuid,
  name text,
  address text,
  latitude double precision,
  longitude double precision,
  is_active boolean,
  routes_count integer
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
    bs.id,
    bs.name,
    bs.address,
    bs.latitude,
    bs.longitude,
    bs.is_active,
    COALESCE(array_length(bs.routes, 1), 0) as routes_count
  FROM public.bus_stops bs
  ORDER BY bs.name;
END;
$$;

-- Get city zones with demand data
CREATE OR REPLACE FUNCTION public.admin_get_city_zones()
RETURNS TABLE(
  id uuid,
  name text,
  center_lat double precision,
  center_lng double precision,
  radius_km numeric,
  demand_score integer,
  active_signals_count integer,
  is_active boolean
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
    cz.id,
    cz.name,
    cz.center_lat,
    cz.center_lng,
    cz.radius_km,
    cz.demand_score,
    cz.active_signals_count,
    cz.is_active
  FROM public.city_zones cz
  ORDER BY cz.demand_score DESC NULLS LAST;
END;
$$;

-- Get map contributions for moderation
CREATE OR REPLACE FUNCTION public.admin_get_contributions()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  contributor_name text,
  contribution_type text,
  local_name text,
  official_name text,
  status text,
  votes_positive integer,
  votes_negative integer,
  points_awarded integer,
  created_at timestamp with time zone
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
    mc.id,
    mc.user_id,
    CONCAT(p.first_name, ' ', p.last_name) as contributor_name,
    mc.contribution_type::text,
    mc.local_name,
    mc.official_name,
    mc.status::text,
    mc.votes_positive,
    mc.votes_negative,
    mc.points_awarded,
    mc.created_at
  FROM public.map_contributions mc
  LEFT JOIN public.profiles p ON mc.user_id = p.id
  ORDER BY mc.created_at DESC;
END;
$$;

-- Get scheduled trips
CREATE OR REPLACE FUNCTION public.admin_get_scheduled_trips()
RETURNS TABLE(
  id uuid,
  client_name text,
  driver_name text,
  origin text,
  destination text,
  scheduled_at timestamp with time zone,
  estimated_fare integer,
  status text,
  created_at timestamp with time zone
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
    st.id,
    CONCAT(pc.first_name, ' ', pc.last_name) as client_name,
    CONCAT(pd.first_name, ' ', pd.last_name) as driver_name,
    st.origin,
    st.destination,
    st.scheduled_at,
    st.estimated_fare,
    st.status,
    st.created_at
  FROM public.scheduled_trips st
  LEFT JOIN public.profiles pc ON st.client_id = pc.id
  LEFT JOIN public.profiles pd ON st.driver_id = pd.id
  ORDER BY st.scheduled_at DESC;
END;
$$;

-- Get financial overview
CREATE OR REPLACE FUNCTION public.admin_get_financial_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  SELECT json_build_object(
    'total_wallet_balance', (SELECT COALESCE(SUM(balance), 0) FROM public.wallets),
    'total_locked_amount', (SELECT COALESCE(SUM(locked_amount), 0) FROM public.wallets),
    'active_holds_count', (SELECT COUNT(*) FROM public.wallet_holds WHERE status = 'active'),
    'active_holds_amount', (SELECT COALESCE(SUM(amount), 0) FROM public.wallet_holds WHERE status = 'active'),
    'total_penalties_collected', (SELECT COALESCE(SUM(penalty_amount), 0) FROM public.wallet_holds WHERE penalty_applied = true),
    'revenue_this_week', (SELECT COALESCE(SUM(fare), 0) FROM public.trips WHERE created_at > now() - interval '7 days'),
    'revenue_this_month', (SELECT COALESCE(SUM(fare), 0) FROM public.trips WHERE created_at > now() - interval '30 days'),
    'avg_trip_fare', (SELECT COALESCE(ROUND(AVG(fare)), 0) FROM public.trips WHERE fare > 0)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Get rewards for management
CREATE OR REPLACE FUNCTION public.admin_get_rewards()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  category text,
  points_cost integer,
  value_fcfa integer,
  stock integer,
  is_active boolean,
  redemptions_count bigint
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
    r.id,
    r.name,
    r.description,
    r.category,
    r.points_cost,
    r.value_fcfa,
    r.stock,
    r.is_active,
    COUNT(rr.id) as redemptions_count
  FROM public.rewards r
  LEFT JOIN public.reward_redemptions rr ON r.id = rr.reward_id
  GROUP BY r.id
  ORDER BY r.points_cost;
END;
$$;

-- Verify/Unverify fleet owner
CREATE OR REPLACE FUNCTION public.admin_toggle_fleet_verification(p_fleet_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  UPDATE public.fleet_owners 
  SET is_verified = NOT is_verified,
      updated_at = now()
  WHERE id = p_fleet_owner_id;
  
  RETURN TRUE;
END;
$$;

-- Validate contribution
CREATE OR REPLACE FUNCTION public.admin_validate_contribution(p_contribution_id uuid, p_approve boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  UPDATE public.map_contributions 
  SET 
    status = CASE WHEN p_approve THEN 'validated'::contribution_status ELSE 'rejected'::contribution_status END,
    validated_at = CASE WHEN p_approve THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = p_contribution_id;
  
  RETURN TRUE;
END;
$$;
