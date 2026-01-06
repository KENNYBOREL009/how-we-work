-- Ajouter colonnes pour notation et suivi de course
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id),
ADD COLUMN IF NOT EXISTS driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
ADD COLUMN IF NOT EXISTS driver_comment TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_shared_ride BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pickup_location TEXT,
ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS current_status TEXT DEFAULT 'searching';

COMMENT ON COLUMN public.trips.current_status IS 'searching, driver_assigned, in_progress, completed, cancelled';
COMMENT ON COLUMN public.trips.payment_status IS 'pending, confirmed, paid, refunded';

-- Table pour les passagers des courses partagées
CREATE TABLE IF NOT EXISTS public.shared_ride_passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  first_name TEXT,
  avatar_url TEXT,
  pickup_location TEXT,
  dropoff_location TEXT,
  fare_amount INTEGER NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'active'
);

-- Enable RLS
ALTER TABLE public.shared_ride_passengers ENABLE ROW LEVEL SECURITY;

-- Politiques: les passagers d'une même course peuvent se voir
CREATE POLICY "Passengers can view co-passengers in same trip"
ON public.shared_ride_passengers
FOR SELECT
USING (
  trip_id IN (
    SELECT trip_id FROM public.shared_ride_passengers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can join shared rides"
ON public.shared_ride_passengers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Table pour les évaluations des chauffeurs (historique)
CREATE TABLE IF NOT EXISTS public.driver_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  user_id UUID NOT NULL,
  trip_id UUID REFERENCES public.trips(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ratings"
ON public.driver_ratings
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own ratings"
ON public.driver_ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Fonction pour calculer la moyenne des notes d'un chauffeur
CREATE OR REPLACE FUNCTION public.get_driver_avg_rating(p_driver_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
  FROM public.driver_ratings
  WHERE driver_id = p_driver_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;