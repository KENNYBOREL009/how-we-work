-- =============================================
-- SCHEMA UPDATES FOR LOKEBO DRIVE
-- =============================================

-- 1. Update bus_routes with missing columns
ALTER TABLE public.bus_routes 
ADD COLUMN IF NOT EXISTS route_number text,
ADD COLUMN IF NOT EXISTS start_point text,
ADD COLUMN IF NOT EXISTS end_point text;

-- 2. Update bus_stops with routes array
ALTER TABLE public.bus_stops 
ADD COLUMN IF NOT EXISTS routes uuid[] DEFAULT '{}';

-- 3. Update city_zones with demand tracking fields
ALTER TABLE public.city_zones 
ADD COLUMN IF NOT EXISTS demand_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_signals_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();

-- 4. Update client_signals with missing fields
ALTER TABLE public.client_signals 
ADD COLUMN IF NOT EXISTS destination text,
ADD COLUMN IF NOT EXISTS trip_type text DEFAULT 'taxi',
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 5. Create bus_schedules table
CREATE TABLE IF NOT EXISTS public.bus_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id uuid REFERENCES public.bus_routes(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  departure_time time without time zone NOT NULL,
  arrival_time time without time zone,
  days_of_week integer[] DEFAULT '{1,2,3,4,5}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on bus_schedules
ALTER TABLE public.bus_schedules ENABLE ROW LEVEL SECURITY;

-- Public read access for schedules
CREATE POLICY "Anyone can view bus schedules"
ON public.bus_schedules FOR SELECT
USING (is_active = true);

-- 6. Create demand_predictions table
CREATE TABLE IF NOT EXISTS public.demand_predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id uuid REFERENCES public.city_zones(id) ON DELETE CASCADE,
  prediction_hour integer NOT NULL CHECK (prediction_hour >= 0 AND prediction_hour <= 23),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  predicted_demand_score integer DEFAULT 50 CHECK (predicted_demand_score >= 0 AND predicted_demand_score <= 100),
  confidence_level numeric DEFAULT 0.5,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demand_predictions ENABLE ROW LEVEL SECURITY;

-- Drivers can view predictions
CREATE POLICY "Authenticated users can view predictions"
ON public.demand_predictions FOR SELECT
TO authenticated
USING (true);

-- 7. Create driver_work_preferences table
CREATE TABLE IF NOT EXISTS public.driver_work_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid NOT NULL,
  preference_date date NOT NULL,
  preferred_zone_id uuid REFERENCES public.city_zones(id) ON DELETE SET NULL,
  start_hour integer DEFAULT 6 CHECK (start_hour >= 0 AND start_hour <= 23),
  end_hour integer DEFAULT 22 CHECK (end_hour >= 0 AND end_hour <= 23),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(driver_id, preference_date)
);

-- Enable RLS
ALTER TABLE public.driver_work_preferences ENABLE ROW LEVEL SECURITY;

-- Drivers can manage their own preferences
CREATE POLICY "Drivers can view their preferences"
ON public.driver_work_preferences FOR SELECT
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create their preferences"
ON public.driver_work_preferences FOR INSERT
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their preferences"
ON public.driver_work_preferences FOR UPDATE
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete their preferences"
ON public.driver_work_preferences FOR DELETE
USING (auth.uid() = driver_id);

-- 8. Add hours_worked column to driver_daily_reports if missing
ALTER TABLE public.driver_daily_reports 
ADD COLUMN IF NOT EXISTS hours_worked numeric DEFAULT 0;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_demand_predictions_zone_time 
ON public.demand_predictions(zone_id, day_of_week, prediction_hour);

CREATE INDEX IF NOT EXISTS idx_driver_work_preferences_date 
ON public.driver_work_preferences(preference_date);

CREATE INDEX IF NOT EXISTS idx_client_signals_active 
ON public.client_signals(is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_bus_schedules_route 
ON public.bus_schedules(route_id, is_active);