-- =============================================
-- DRIVER MATCHING & SURGE PRICING TABLES
-- =============================================

-- Create surge_pricing_zones table
CREATE TABLE IF NOT EXISTS public.surge_pricing_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID REFERENCES public.city_zones(id),
  zone_name TEXT NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  demand_count INTEGER DEFAULT 0,
  driver_count INTEGER DEFAULT 0,
  surge_multiplier NUMERIC(3, 2) DEFAULT 1.00,
  is_active BOOLEAN DEFAULT true,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT now() + interval '15 minutes',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ride_requests table for matching cascade
CREATE TABLE IF NOT EXISTS public.ride_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  origin TEXT NOT NULL,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination TEXT NOT NULL,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  estimated_fare NUMERIC DEFAULT 0,
  surge_multiplier NUMERIC(3, 2) DEFAULT 1.00,
  final_fare NUMERIC DEFAULT 0,
  vehicle_type TEXT DEFAULT 'taxi',
  passenger_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'searching',
  current_driver_id UUID,
  driver_notified_at TIMESTAMP WITH TIME ZONE,
  driver_notification_count INTEGER DEFAULT 0,
  matched_driver_id UUID,
  matched_at TIMESTAMP WITH TIME ZONE,
  trip_id UUID REFERENCES public.trips(id),
  expired_drivers UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create driver_match_scores table for tracking scoring
CREATE TABLE IF NOT EXISTS public.driver_match_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_request_id UUID REFERENCES public.ride_requests(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  distance_score NUMERIC DEFAULT 0,
  rating_score NUMERIC DEFAULT 0,
  acceptance_score NUMERIC DEFAULT 0,
  history_score NUMERIC DEFAULT 0,
  total_score NUMERIC DEFAULT 0,
  rank INTEGER,
  notified_at TIMESTAMP WITH TIME ZONE,
  response TEXT, -- 'accepted', 'declined', 'timeout'
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create momo_transactions table for Mobile Money
CREATE TABLE IF NOT EXISTS public.momo_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_id UUID REFERENCES public.wallets(id),
  provider TEXT DEFAULT 'mtn_momo',
  phone_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XAF',
  transaction_type TEXT DEFAULT 'deposit', -- deposit, withdrawal
  reference_id UUID DEFAULT gen_random_uuid(),
  external_reference TEXT,
  status TEXT DEFAULT 'pending', -- pending, processing, success, failed, cancelled
  error_message TEXT,
  callback_received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surge_pricing_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for surge_pricing_zones (readable by all authenticated)
CREATE POLICY "Anyone can view active surge zones"
ON public.surge_pricing_zones FOR SELECT
USING (is_active = true);

-- RLS Policies for ride_requests
CREATE POLICY "Clients can view their own ride requests"
ON public.ride_requests FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Drivers can view ride requests where they are current driver"
ON public.ride_requests FOR SELECT
USING (auth.uid() = current_driver_id OR auth.uid() = matched_driver_id);

CREATE POLICY "Clients can create ride requests"
ON public.ride_requests FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "System can update ride requests"
ON public.ride_requests FOR UPDATE
USING (auth.uid() = client_id OR auth.uid() = current_driver_id OR auth.uid() = matched_driver_id);

-- RLS Policies for driver_match_scores
CREATE POLICY "Drivers can view their own match scores"
ON public.driver_match_scores FOR SELECT
USING (auth.uid() = driver_id);

-- RLS Policies for momo_transactions
CREATE POLICY "Users can view their own momo transactions"
ON public.momo_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own momo transactions"
ON public.momo_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- DATABASE FUNCTIONS FOR MATCHING & SURGE
-- =============================================

-- Function to calculate surge multiplier for a zone
CREATE OR REPLACE FUNCTION public.calculate_surge_multiplier(
  p_demand_count INTEGER,
  p_driver_count INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ratio NUMERIC;
  v_multiplier NUMERIC;
BEGIN
  -- Avoid division by zero
  IF p_driver_count = 0 THEN
    v_ratio := p_demand_count;
  ELSE
    v_ratio := p_demand_count::NUMERIC / p_driver_count::NUMERIC;
  END IF;
  
  -- Calculate multiplier based on ratio
  IF v_ratio > 2 THEN
    v_multiplier := 2.0; -- Max surge
  ELSIF v_ratio > 1.5 THEN
    v_multiplier := 1.5;
  ELSIF v_ratio > 1 THEN
    v_multiplier := 1.2;
  ELSE
    v_multiplier := 1.0;
  END IF;
  
  RETURN v_multiplier;
END;
$$;

-- Function to find and score drivers for a ride request
CREATE OR REPLACE FUNCTION public.find_best_drivers(
  p_request_id UUID,
  p_origin_lat DOUBLE PRECISION,
  p_origin_lng DOUBLE PRECISION,
  p_client_id UUID,
  p_max_distance_km DOUBLE PRECISION DEFAULT 3.0
)
RETURNS TABLE (
  driver_id UUID,
  total_score NUMERIC,
  distance_km NUMERIC,
  rating NUMERIC,
  acceptance_rate NUMERIC,
  has_history BOOLEAN,
  rank INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH driver_data AS (
    SELECT 
      v.driver_id,
      vp.latitude,
      vp.longitude,
      -- Calculate distance using Haversine
      6371 * 2 * asin(sqrt(
        power(sin(radians(p_origin_lat - vp.latitude) / 2), 2) +
        cos(radians(vp.latitude)) * cos(radians(p_origin_lat)) *
        power(sin(radians(p_origin_lng - vp.longitude) / 2), 2)
      )) as distance_km
    FROM vehicles v
    INNER JOIN vehicle_positions vp ON v.id = vp.vehicle_id
    WHERE v.is_active = true
      AND v.status = 'available'
      AND v.driver_id IS NOT NULL
      AND vp.recorded_at = (
        SELECT MAX(vp2.recorded_at) 
        FROM vehicle_positions vp2 
        WHERE vp2.vehicle_id = v.id
      )
  ),
  scored_drivers AS (
    SELECT 
      dd.driver_id,
      dd.distance_km,
      COALESCE(drs.reliability_score, 80) as rating,
      COALESCE(drs.acceptance_rate, 70) as acceptance_rate,
      EXISTS(
        SELECT 1 FROM trips t 
        WHERE t.vehicle_id IN (SELECT id FROM vehicles WHERE driver_id = dd.driver_id)
        AND t.user_id = p_client_id
        AND t.status = 'completed'
      ) as has_history,
      -- Score calculation
      100 - (dd.distance_km * 10) -- Distance: 40%
      + (COALESCE(drs.reliability_score, 80) - 50) * 0.6 -- Rating: 30%
      + (COALESCE(drs.acceptance_rate, 70) - 50) * 0.4 -- Acceptance: 20%
      + CASE WHEN EXISTS(
        SELECT 1 FROM trips t 
        WHERE t.vehicle_id IN (SELECT id FROM vehicles WHERE driver_id = dd.driver_id)
        AND t.user_id = p_client_id
        AND t.status = 'completed'
      ) THEN 10 ELSE 0 END -- History: 10%
      as total_score
    FROM driver_data dd
    LEFT JOIN driver_reliability_scores drs ON dd.driver_id = drs.driver_id
    WHERE dd.distance_km <= p_max_distance_km
  )
  SELECT 
    sd.driver_id,
    ROUND(sd.total_score, 2),
    ROUND(sd.distance_km, 2),
    sd.rating,
    sd.acceptance_rate,
    sd.has_history,
    ROW_NUMBER() OVER (ORDER BY sd.total_score DESC)::INTEGER as rank
  FROM scored_drivers sd
  ORDER BY sd.total_score DESC
  LIMIT 5;
END;
$$;

-- Function to notify next driver in cascade
CREATE OR REPLACE FUNCTION public.notify_next_driver(p_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_next_driver RECORD;
  v_result JSONB;
BEGIN
  -- Get request info
  SELECT * INTO v_request FROM ride_requests WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;
  
  -- Find next driver not in expired list
  SELECT dms.* INTO v_next_driver
  FROM driver_match_scores dms
  WHERE dms.ride_request_id = p_request_id
    AND dms.response IS NULL
    AND NOT (dms.driver_id = ANY(v_request.expired_drivers))
  ORDER BY dms.rank ASC
  LIMIT 1;
  
  IF v_next_driver IS NULL THEN
    -- No more drivers available
    UPDATE ride_requests
    SET status = 'no_driver_available', updated_at = now()
    WHERE id = p_request_id;
    
    RETURN jsonb_build_object('success', false, 'error', 'No drivers available');
  END IF;
  
  -- Update request with current driver
  UPDATE ride_requests
  SET current_driver_id = v_next_driver.driver_id,
      driver_notified_at = now(),
      driver_notification_count = driver_notification_count + 1,
      updated_at = now()
  WHERE id = p_request_id;
  
  -- Update match score with notification time
  UPDATE driver_match_scores
  SET notified_at = now()
  WHERE id = v_next_driver.id;
  
  -- Create notification for driver
  INSERT INTO notifications (user_id, title, message, type, data)
  VALUES (
    v_next_driver.driver_id,
    'Nouvelle course disponible',
    'Un client recherche un taxi à proximité',
    'trip_update',
    jsonb_build_object(
      'request_id', p_request_id,
      'origin', v_request.origin,
      'destination', v_request.destination,
      'fare', v_request.final_fare,
      'timeout_seconds', 30
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'driver_id', v_next_driver.driver_id,
    'rank', v_next_driver.rank,
    'score', v_next_driver.total_score
  );
END;
$$;

-- Function for driver to respond to request
CREATE OR REPLACE FUNCTION public.driver_respond_to_request(
  p_request_id UUID,
  p_driver_id UUID,
  p_response TEXT -- 'accept' or 'decline'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_trip_id UUID;
BEGIN
  -- Get request
  SELECT * INTO v_request FROM ride_requests WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;
  
  IF v_request.current_driver_id != p_driver_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not your turn to respond');
  END IF;
  
  IF v_request.status != 'searching' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already handled');
  END IF;
  
  -- Update match score with response
  UPDATE driver_match_scores
  SET response = p_response, responded_at = now()
  WHERE ride_request_id = p_request_id AND driver_id = p_driver_id;
  
  IF p_response = 'accept' THEN
    -- Create trip
    INSERT INTO trips (user_id, trip_type, origin, destination, fare, status, current_status)
    VALUES (v_request.client_id, 'taxi', v_request.origin, v_request.destination, v_request.final_fare, 'active', 'driver_assigned')
    RETURNING id INTO v_trip_id;
    
    -- Update request
    UPDATE ride_requests
    SET status = 'matched',
        matched_driver_id = p_driver_id,
        matched_at = now(),
        trip_id = v_trip_id,
        updated_at = now()
    WHERE id = p_request_id;
    
    -- Notify client
    INSERT INTO notifications (user_id, title, message, type, data)
    VALUES (
      v_request.client_id,
      'Chauffeur trouvé !',
      'Un chauffeur a accepté votre course',
      'trip_update',
      jsonb_build_object('trip_id', v_trip_id, 'driver_id', p_driver_id)
    );
    
    RETURN jsonb_build_object('success', true, 'trip_id', v_trip_id);
    
  ELSE
    -- Decline - add to expired drivers and notify next
    UPDATE ride_requests
    SET expired_drivers = array_append(expired_drivers, p_driver_id),
        current_driver_id = NULL,
        updated_at = now()
    WHERE id = p_request_id;
    
    -- Notify next driver
    RETURN notify_next_driver(p_request_id);
  END IF;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON public.ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_client ON public.ride_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_driver ON public.ride_requests(current_driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_match_scores_request ON public.driver_match_scores(ride_request_id);
CREATE INDEX IF NOT EXISTS idx_surge_zones_active ON public.surge_pricing_zones(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_momo_transactions_user ON public.momo_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_momo_transactions_status ON public.momo_transactions(status);

-- Enable realtime for ride_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_requests;