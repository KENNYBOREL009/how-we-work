-- Table pour les disponibilités des chauffeurs
CREATE TABLE public.driver_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  origin_zone TEXT NOT NULL,
  destination_zone TEXT,
  vehicle_type TEXT DEFAULT 'standard',
  is_recurring BOOLEAN DEFAULT true,
  specific_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les courses programmées
CREATE TABLE public.scheduled_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  driver_id UUID,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  vehicle_type TEXT DEFAULT 'standard',
  estimated_fare INTEGER NOT NULL,
  security_deposit INTEGER DEFAULT 500,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'confirmed', 'cancelled', 'completed', 'no_show_client', 'no_show_driver')),
  driver_accepted_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by TEXT,
  penalty_amount INTEGER DEFAULT 0,
  client_notes TEXT,
  driver_notes TEXT,
  matched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les scores de fiabilité des chauffeurs
CREATE TABLE public.driver_reliability_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL UNIQUE,
  total_scheduled_trips INTEGER DEFAULT 0,
  completed_trips INTEGER DEFAULT 0,
  no_show_count INTEGER DEFAULT 0,
  late_count INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 100.00,
  punctuality_score DECIMAL(5,2) DEFAULT 100.00,
  reliability_score DECIMAL(5,2) DEFAULT 100.00,
  is_scheduling_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_reliability_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driver_availability
CREATE POLICY "Drivers can manage their availability"
ON public.driver_availability
FOR ALL
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Anyone can view driver availability for matching"
ON public.driver_availability
FOR SELECT
USING (true);

-- RLS Policies for scheduled_trips
CREATE POLICY "Clients can view their scheduled trips"
ON public.scheduled_trips
FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Drivers can view their assigned trips"
ON public.scheduled_trips
FOR SELECT
USING (auth.uid() = driver_id);

CREATE POLICY "Clients can create scheduled trips"
ON public.scheduled_trips
FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their pending trips"
ON public.scheduled_trips
FOR UPDATE
USING (auth.uid() = client_id AND status IN ('pending', 'matched'));

CREATE POLICY "Drivers can update their assigned trips"
ON public.scheduled_trips
FOR UPDATE
USING (auth.uid() = driver_id);

-- RLS Policies for driver_reliability_scores
CREATE POLICY "Drivers can view their own scores"
ON public.driver_reliability_scores
FOR SELECT
USING (auth.uid() = driver_id);

CREATE POLICY "Anyone can view driver scores for transparency"
ON public.driver_reliability_scores
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_driver_availability_updated_at
BEFORE UPDATE ON public.driver_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_trips_updated_at
BEFORE UPDATE ON public.scheduled_trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_reliability_scores_updated_at
BEFORE UPDATE ON public.driver_reliability_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trip_type constraint update for 'scheduled'
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_trip_type_check;
ALTER TABLE public.trips ADD CONSTRAINT trips_trip_type_check 
CHECK (trip_type = ANY (ARRAY['taxi'::text, 'bus'::text, 'reservation'::text, 'confort-partage'::text, 'privatisation'::text, 'scheduled'::text]));