-- Table pour stocker l'historique des patterns de trafic
CREATE TABLE public.traffic_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_lat DECIMAL(9,6) NOT NULL,
  zone_lng DECIMAL(9,6) NOT NULL,
  zone_name TEXT,
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day < 24),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week < 7),
  avg_demand DECIMAL(10,2) DEFAULT 0,
  peak_demand INTEGER DEFAULT 0,
  sample_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les routes apprises par l'IA
CREATE TABLE public.learned_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  origin_lat DECIMAL(9,6) NOT NULL,
  origin_lng DECIMAL(9,6) NOT NULL,
  origin_name TEXT,
  destination_lat DECIMAL(9,6) NOT NULL,
  destination_lng DECIMAL(9,6) NOT NULL,
  destination_name TEXT,
  avg_fare DECIMAL(10,2),
  avg_duration_minutes INTEGER,
  trip_count INTEGER DEFAULT 1,
  popularity_score DECIMAL(5,2) DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les recommandations IA aux chauffeurs
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('hotspot', 'route', 'timing', 'positioning')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  zone_lat DECIMAL(9,6),
  zone_lng DECIMAL(9,6),
  predicted_demand INTEGER,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.traffic_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learned_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Policies: traffic_patterns readable by all authenticated users
CREATE POLICY "Traffic patterns viewable by all authenticated users"
ON public.traffic_patterns FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage traffic patterns"
ON public.traffic_patterns FOR ALL
USING (true)
WITH CHECK (true);

-- Policies: learned_routes readable by all authenticated users
CREATE POLICY "Learned routes viewable by all authenticated users"
ON public.learned_routes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage learned routes"
ON public.learned_routes FOR ALL
USING (true)
WITH CHECK (true);

-- Policies: ai_recommendations 
CREATE POLICY "Drivers can view their recommendations"
ON public.ai_recommendations FOR SELECT
USING (driver_id IS NULL OR auth.uid() = driver_id);

CREATE POLICY "System can manage AI recommendations"
ON public.ai_recommendations FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes pour performance
CREATE INDEX idx_traffic_patterns_zone ON public.traffic_patterns(zone_lat, zone_lng);
CREATE INDEX idx_traffic_patterns_time ON public.traffic_patterns(hour_of_day, day_of_week);
CREATE INDEX idx_learned_routes_origin ON public.learned_routes(origin_lat, origin_lng);
CREATE INDEX idx_learned_routes_popularity ON public.learned_routes(popularity_score DESC);
CREATE INDEX idx_ai_recommendations_driver ON public.ai_recommendations(driver_id) WHERE is_active = true;

-- Enable realtime for recommendations
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_recommendations;