-- =====================================================
-- MODULE 1: Map Contributor & Gamification
-- =====================================================

-- Enum pour types de contributions
CREATE TYPE public.contribution_type AS ENUM ('local_name', 'road_trace', 'error_report');
CREATE TYPE public.contribution_status AS ENUM ('pending', 'validated', 'rejected');
CREATE TYPE public.error_type AS ENUM ('road_blocked', 'one_way', 'non_existent', 'other');

-- Table des contributions cartographiques
CREATE TABLE public.map_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contribution_type contribution_type NOT NULL,
  status contribution_status DEFAULT 'pending',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  
  -- Pour les noms locaux
  local_name TEXT,
  official_name TEXT, -- Nom Mapbox existant si doublon détecté
  photo_url TEXT,
  
  -- Pour les traces GPS
  route_trace JSONB, -- Array de coordonnées [{lat, lng}]
  route_length_km NUMERIC,
  is_new_road BOOLEAN DEFAULT false,
  
  -- Pour les erreurs
  error_type error_type,
  error_description TEXT,
  
  -- Métadonnées
  mapbox_poi_id TEXT, -- ID du POI Mapbox si c'est un alias
  votes_positive INTEGER DEFAULT 0,
  votes_negative INTEGER DEFAULT 0,
  votes_unknown INTEGER DEFAULT 0,
  points_awarded INTEGER DEFAULT 0,
  validated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des votes de validation
CREATE TABLE public.contribution_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id UUID REFERENCES public.map_contributions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'no', 'unknown')),
  points_earned INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(contribution_id, user_id)
);

-- Table des points utilisateur (Gamification)
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  current_points INTEGER DEFAULT 0, -- Points disponibles à dépenser
  level_name TEXT DEFAULT 'Débutant',
  level_threshold INTEGER DEFAULT 0,
  next_level_threshold INTEGER DEFAULT 500,
  contributions_count INTEGER DEFAULT 0,
  validations_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des récompenses disponibles
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'credit', 'badge', 'service'
  points_cost INTEGER NOT NULL,
  value_fcfa INTEGER, -- Pour les crédits de course
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  stock INTEGER, -- NULL = illimité
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des échanges de récompenses
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES public.rewards(id) NOT NULL,
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- MODULE 2: Smart Routine & Prédiction
-- =====================================================

-- Table des zones de quartier
CREATE TABLE public.city_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_km NUMERIC DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des intentions chauffeur (Zone de chasse)
CREATE TABLE public.driver_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_zone_id UUID REFERENCES public.city_zones(id),
  target_zone_name TEXT, -- Fallback si pas de zone définie
  intended_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  is_high_demand_zone BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(driver_id, intended_date)
);

-- Table des routines passager
CREATE TABLE public.passenger_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  routine_name TEXT DEFAULT 'Trajet Travail',
  origin_zone_id UUID REFERENCES public.city_zones(id),
  origin_name TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  destination_zone_id UUID REFERENCES public.city_zones(id),
  destination_name TEXT NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  typical_departure_time TIME,
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}', -- Lundi=1 à Dimanche=7
  is_active BOOLEAN DEFAULT true,
  trip_count INTEGER DEFAULT 0, -- Nombre de fois ce trajet fait
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des signaux de demande future
CREATE TABLE public.demand_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.city_zones(id),
  zone_name TEXT,
  signal_date DATE NOT NULL,
  signal_time TIME NOT NULL,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  passenger_count INTEGER DEFAULT 1,
  is_from_routine BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.map_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passenger_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_signals ENABLE ROW LEVEL SECURITY;

-- Map Contributions policies
CREATE POLICY "Users can view all validated contributions"
ON public.map_contributions FOR SELECT
USING (status = 'validated' OR user_id = auth.uid());

CREATE POLICY "Users can create contributions"
ON public.map_contributions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending contributions"
ON public.map_contributions FOR UPDATE
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (user_id = auth.uid());

-- Contribution votes policies
CREATE POLICY "Users can view votes"
ON public.contribution_votes FOR SELECT
USING (true);

CREATE POLICY "Users can vote on contributions"
ON public.contribution_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User points policies
CREATE POLICY "Users can view own points"
ON public.user_points FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage points"
ON public.user_points FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Rewards policies
CREATE POLICY "Anyone can view active rewards"
ON public.rewards FOR SELECT
USING (is_active = true);

-- Reward redemptions policies
CREATE POLICY "Users can view own redemptions"
ON public.reward_redemptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create redemptions"
ON public.reward_redemptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- City zones policies
CREATE POLICY "Anyone can view zones"
ON public.city_zones FOR SELECT
USING (is_active = true);

-- Driver intentions policies
CREATE POLICY "Drivers can manage own intentions"
ON public.driver_intentions FOR ALL
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "System can view all intentions for matching"
ON public.driver_intentions FOR SELECT
USING (true);

-- Passenger routines policies
CREATE POLICY "Users can manage own routines"
ON public.passenger_routines FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Demand signals policies
CREATE POLICY "Users can create signals"
ON public.demand_signals FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Authenticated users can view signals"
ON public.demand_signals FOR SELECT
USING (true);

-- =====================================================
-- Functions
-- =====================================================

-- Fonction pour ajouter des points
CREATE OR REPLACE FUNCTION public.add_user_points(
  p_user_id UUID,
  p_points INTEGER,
  p_action TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_new_level TEXT;
  v_new_threshold INTEGER;
BEGIN
  -- Créer l'entrée si elle n'existe pas
  INSERT INTO user_points (user_id, total_points, current_points)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Ajouter les points
  UPDATE user_points
  SET 
    total_points = total_points + p_points,
    current_points = current_points + p_points,
    contributions_count = CASE WHEN p_action = 'contribution' THEN contributions_count + 1 ELSE contributions_count END,
    validations_count = CASE WHEN p_action = 'validation' THEN validations_count + 1 ELSE validations_count END,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING total_points INTO v_total;
  
  -- Mettre à jour le niveau
  SELECT 
    CASE 
      WHEN v_total >= 5000 THEN 'Cartographe Expert'
      WHEN v_total >= 2000 THEN 'Explorateur Confirmé'
      WHEN v_total >= 1000 THEN 'Explorateur Local'
      WHEN v_total >= 500 THEN 'Contributeur Actif'
      ELSE 'Débutant'
    END,
    CASE 
      WHEN v_total >= 5000 THEN 10000
      WHEN v_total >= 2000 THEN 5000
      WHEN v_total >= 1000 THEN 2000
      WHEN v_total >= 500 THEN 1000
      ELSE 500
    END
  INTO v_new_level, v_new_threshold;
  
  UPDATE user_points
  SET 
    level_name = v_new_level,
    next_level_threshold = v_new_threshold
  WHERE user_id = p_user_id;
END;
$$;

-- Fonction pour valider une contribution après 3 votes positifs
CREATE OR REPLACE FUNCTION public.check_contribution_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contribution RECORD;
  v_points INTEGER;
BEGIN
  -- Mettre à jour les compteurs
  UPDATE map_contributions
  SET 
    votes_positive = votes_positive + CASE WHEN NEW.vote = 'yes' THEN 1 ELSE 0 END,
    votes_negative = votes_negative + CASE WHEN NEW.vote = 'no' THEN 1 ELSE 0 END,
    votes_unknown = votes_unknown + CASE WHEN NEW.vote = 'unknown' THEN 1 ELSE 0 END
  WHERE id = NEW.contribution_id
  RETURNING * INTO v_contribution;
  
  -- Donner des points au votant
  PERFORM add_user_points(NEW.user_id, 5, 'validation');
  
  -- Vérifier si validation atteinte (3 votes positifs)
  IF v_contribution.votes_positive >= 3 AND v_contribution.status = 'pending' THEN
    -- Déterminer les points selon le type
    v_points := CASE v_contribution.contribution_type
      WHEN 'local_name' THEN 50
      WHEN 'road_trace' THEN 100
      WHEN 'error_report' THEN 30
      ELSE 20
    END;
    
    -- Bonus si photo
    IF v_contribution.photo_url IS NOT NULL THEN
      v_points := v_points + 20;
    END IF;
    
    -- Valider et attribuer les points
    UPDATE map_contributions
    SET 
      status = 'validated',
      validated_at = now(),
      points_awarded = v_points
    WHERE id = NEW.contribution_id;
    
    PERFORM add_user_points(v_contribution.user_id, v_points, 'contribution');
  END IF;
  
  -- Rejeter si trop de votes négatifs
  IF v_contribution.votes_negative >= 3 AND v_contribution.status = 'pending' THEN
    UPDATE map_contributions
    SET status = 'rejected'
    WHERE id = NEW.contribution_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_contribution_vote
AFTER INSERT ON public.contribution_votes
FOR EACH ROW
EXECUTE FUNCTION public.check_contribution_validation();

-- Fonction pour calculer la demande prévue par zone
CREATE OR REPLACE FUNCTION public.get_predicted_demand(
  p_date DATE,
  p_hour INTEGER
)
RETURNS TABLE (
  zone_id UUID,
  zone_name TEXT,
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  predicted_demand INTEGER,
  driver_supply INTEGER,
  demand_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cz.id,
    cz.name,
    cz.center_lat,
    cz.center_lng,
    COALESCE(COUNT(DISTINCT ds.id), 0)::INTEGER as predicted_demand,
    COALESCE(COUNT(DISTINCT di.id), 0)::INTEGER as driver_supply,
    CASE 
      WHEN COUNT(DISTINCT ds.id) > COUNT(DISTINCT di.id) * 2 THEN 'high'
      WHEN COUNT(DISTINCT ds.id) > COUNT(DISTINCT di.id) THEN 'medium'
      ELSE 'low'
    END as demand_level
  FROM city_zones cz
  LEFT JOIN demand_signals ds ON (
    ds.zone_id = cz.id 
    AND ds.signal_date = p_date
    AND EXTRACT(HOUR FROM ds.signal_time) = p_hour
  )
  LEFT JOIN driver_intentions di ON (
    di.target_zone_id = cz.id
    AND di.intended_date = p_date
    AND EXTRACT(HOUR FROM di.start_time) <= p_hour
    AND (di.end_time IS NULL OR EXTRACT(HOUR FROM di.end_time) >= p_hour)
  )
  WHERE cz.is_active = true
  GROUP BY cz.id, cz.name, cz.center_lat, cz.center_lng;
END;
$$;

-- Insérer les zones de Douala
INSERT INTO public.city_zones (name, center_lat, center_lng, radius_km) VALUES
('Akwa', 4.0511, 9.7043, 2),
('Bonanjo', 4.0439, 9.6920, 1.5),
('Deido', 4.0650, 9.7200, 2),
('Bonamoussadi', 4.0800, 9.7400, 2.5),
('Makepe', 4.0700, 9.7500, 2),
('Bonapriso', 4.0300, 9.6900, 1.5),
('Bepanda', 4.0550, 9.7350, 2),
('Logbessou', 4.0900, 9.7300, 2),
('Ndokotti', 4.0400, 9.7500, 2),
('Bonabéri', 4.0800, 9.6600, 3);

-- Insérer quelques récompenses
INSERT INTO public.rewards (name, description, category, points_cost, value_fcfa, icon) VALUES
('Crédit 500F', 'Réduction de 500 FCFA sur votre prochaine course', 'credit', 1000, 500, 'coins'),
('Crédit 1000F', 'Réduction de 1000 FCFA sur votre prochaine course', 'credit', 1800, 1000, 'coins'),
('Badge VIP', 'Accès prioritaire aux taxis en heure de pointe', 'badge', 2500, NULL, 'crown'),
('Badge Explorateur', 'Reconnaissance pour vos contributions à la carte', 'badge', 500, NULL, 'map');

-- Indexes pour performance
CREATE INDEX idx_contributions_status ON public.map_contributions(status);
CREATE INDEX idx_contributions_location ON public.map_contributions(latitude, longitude);
CREATE INDEX idx_driver_intentions_date ON public.driver_intentions(intended_date);
CREATE INDEX idx_demand_signals_date ON public.demand_signals(signal_date, signal_time);
CREATE INDEX idx_passenger_routines_user ON public.passenger_routines(user_id, is_active);

-- Triggers updated_at
CREATE TRIGGER update_map_contributions_updated_at
BEFORE UPDATE ON public.map_contributions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_passenger_routines_updated_at
BEFORE UPDATE ON public.passenger_routines
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();