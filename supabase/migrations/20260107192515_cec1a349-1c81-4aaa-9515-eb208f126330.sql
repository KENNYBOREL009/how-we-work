-- Table pour les demandes de trajet partagé (Confort Partagé)
CREATE TABLE public.shared_comfort_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  origin_name TEXT,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  destination_name TEXT,
  seat_preference TEXT NOT NULL DEFAULT 'any', -- 'any', 'front', 'back-alone'
  estimated_distance_km NUMERIC,
  estimated_fare INTEGER,
  status TEXT NOT NULL DEFAULT 'searching', -- 'searching', 'matched', 'accepted', 'in_progress', 'completed', 'cancelled'
  matched_vehicle_id UUID REFERENCES public.vehicles(id),
  matched_at TIMESTAMP WITH TIME ZONE,
  detour_minutes INTEGER,
  current_passengers_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_comfort_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create their own requests"
ON public.shared_comfort_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests"
ON public.shared_comfort_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests"
ON public.shared_comfort_requests
FOR UPDATE
USING (auth.uid() = user_id AND status IN ('searching', 'matched'))
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Drivers can view matched requests for their vehicle"
ON public.shared_comfort_requests
FOR SELECT
USING (
  matched_vehicle_id IN (
    SELECT id FROM vehicles WHERE driver_id = auth.uid()
  )
);

CREATE POLICY "Drivers can update matched requests"
ON public.shared_comfort_requests
FOR UPDATE
USING (
  matched_vehicle_id IN (
    SELECT id FROM vehicles WHERE driver_id = auth.uid()
  )
);

-- Index for efficient queries
CREATE INDEX idx_shared_comfort_requests_status ON public.shared_comfort_requests(status);
CREATE INDEX idx_shared_comfort_requests_user ON public.shared_comfort_requests(user_id);
CREATE INDEX idx_shared_comfort_requests_vehicle ON public.shared_comfort_requests(matched_vehicle_id);

-- Trigger for updated_at
CREATE TRIGGER update_shared_comfort_requests_updated_at
BEFORE UPDATE ON public.shared_comfort_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to find compatible vehicles for shared comfort
CREATE OR REPLACE FUNCTION public.find_compatible_vehicles(
  p_origin_lat DOUBLE PRECISION,
  p_origin_lng DOUBLE PRECISION,
  p_destination_lat DOUBLE PRECISION,
  p_destination_lng DOUBLE PRECISION,
  p_max_detour_minutes INTEGER DEFAULT 5,
  p_seat_preference TEXT DEFAULT 'any'
)
RETURNS TABLE (
  vehicle_id UUID,
  driver_id UUID,
  plate_number TEXT,
  current_passengers INTEGER,
  available_seats INTEGER,
  vehicle_lat DOUBLE PRECISION,
  vehicle_lng DOUBLE PRECISION,
  destination TEXT,
  distance_to_pickup_km NUMERIC,
  heading DOUBLE PRECISION,
  direction_compatibility NUMERIC,
  estimated_detour_minutes INTEGER,
  fare_per_km INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  -- Calculate user's travel direction (bearing)
  user_bearing DOUBLE PRECISION;
BEGIN
  -- Calculate bearing from origin to destination
  user_bearing := degrees(
    atan2(
      sin(radians(p_destination_lng - p_origin_lng)) * cos(radians(p_destination_lat)),
      cos(radians(p_origin_lat)) * sin(radians(p_destination_lat)) - 
      sin(radians(p_origin_lat)) * cos(radians(p_destination_lat)) * cos(radians(p_destination_lng - p_origin_lng))
    )
  );
  
  RETURN QUERY
  WITH vehicle_data AS (
    SELECT 
      v.id as vid,
      v.driver_id as vdriver_id,
      v.plate_number as vplate,
      COALESCE(v.current_passengers, 0) as curr_pass,
      COALESCE(v.capacity, 4) - COALESCE(v.current_passengers, 0) as avail_seats,
      vp.latitude as vlat,
      vp.longitude as vlng,
      v.destination as vdest,
      vp.heading as vheading,
      COALESCE(v.shared_ride_fare_per_km, 200) as fare_km,
      -- Haversine distance from vehicle to pickup point (km)
      6371 * 2 * asin(sqrt(
        power(sin(radians(p_origin_lat - vp.latitude) / 2), 2) +
        cos(radians(vp.latitude)) * cos(radians(p_origin_lat)) *
        power(sin(radians(p_origin_lng - vp.longitude) / 2), 2)
      )) as dist_to_pickup
    FROM vehicles v
    INNER JOIN vehicle_positions vp ON v.id = vp.vehicle_id
    WHERE v.is_active = true
      AND v.ride_mode = 'shared'
      AND v.status IN ('available', 'busy')
      -- Filter by available seats based on preference
      AND (
        CASE 
          WHEN p_seat_preference = 'front' THEN COALESCE(v.current_passengers, 0) < 1
          WHEN p_seat_preference = 'back-alone' THEN COALESCE(v.current_passengers, 0) = 0
          ELSE COALESCE(v.current_passengers, 0) < COALESCE(v.capacity, 4)
        END
      )
      -- Only get the latest position per vehicle
      AND vp.recorded_at = (
        SELECT MAX(vp2.recorded_at) 
        FROM vehicle_positions vp2 
        WHERE vp2.vehicle_id = v.id
      )
  )
  SELECT 
    vd.vid,
    vd.vdriver_id,
    vd.vplate,
    vd.curr_pass,
    vd.avail_seats,
    vd.vlat,
    vd.vlng,
    vd.vdest,
    ROUND(vd.dist_to_pickup::numeric, 2),
    vd.vheading,
    -- Direction compatibility (0-100, higher is better)
    -- Based on angle difference between vehicle heading and user's travel direction
    CASE 
      WHEN vd.vheading IS NULL THEN 50.0
      ELSE GREATEST(0, 100 - ABS(
        CASE 
          WHEN ABS(vd.vheading - user_bearing) > 180 
          THEN 360 - ABS(vd.vheading - user_bearing)
          ELSE ABS(vd.vheading - user_bearing)
        END
      ) * 100 / 30) -- 30 degrees = max compatible angle
    END as dir_compat,
    -- Estimated detour in minutes (rough: 1km = 2min in city)
    LEAST(ROUND(vd.dist_to_pickup * 2)::integer, 15) as est_detour,
    vd.fare_km
  FROM vehicle_data vd
  WHERE vd.dist_to_pickup < 5 -- Max 5km pickup distance
    AND (
      -- Direction compatibility check (angle < 30 degrees)
      vd.vheading IS NULL 
      OR ABS(
        CASE 
          WHEN ABS(vd.vheading - user_bearing) > 180 
          THEN 360 - ABS(vd.vheading - user_bearing)
          ELSE ABS(vd.vheading - user_bearing)
        END
      ) < 30
    )
  ORDER BY 
    -- Prioritize: direction compatibility, then distance
    dir_compat DESC,
    vd.dist_to_pickup ASC
  LIMIT 5;
END;
$$;