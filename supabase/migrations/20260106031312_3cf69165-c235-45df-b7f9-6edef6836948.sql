-- Ajouter les colonnes pour les courses partagées
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS ride_mode TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS current_passengers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shared_ride_origin TEXT,
ADD COLUMN IF NOT EXISTS shared_ride_fare_per_km INTEGER DEFAULT 200;

-- Commentaires pour clarifier
COMMENT ON COLUMN public.vehicles.ride_mode IS 'standard, confort-partage, privatisation';
COMMENT ON COLUMN public.vehicles.current_passengers IS 'Nombre actuel de passagers dans le véhicule';
COMMENT ON COLUMN public.vehicles.shared_ride_origin IS 'Point de départ de la course partagée';
COMMENT ON COLUMN public.vehicles.shared_ride_fare_per_km IS 'Tarif par km pour course partagée';