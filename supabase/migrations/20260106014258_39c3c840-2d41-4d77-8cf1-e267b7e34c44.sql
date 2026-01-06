-- Table des arrêts de bus
CREATE TABLE public.bus_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des lignes de bus
CREATE TABLE public.bus_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#FFD42F',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table de liaison route-arrêts avec ordre et horaires
CREATE TABLE public.route_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.bus_routes(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES public.bus_stops(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  arrival_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(route_id, stop_id)
);

-- Table des véhicules (bus et taxis)
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bus', 'taxi')),
  plate_number TEXT NOT NULL UNIQUE,
  capacity INTEGER DEFAULT 4,
  current_route_id UUID REFERENCES public.bus_routes(id),
  destination TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'full', 'private', 'offline')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Positions en temps réel des véhicules
CREATE TABLE public.vehicle_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bus_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_positions ENABLE ROW LEVEL SECURITY;

-- Public read access for stops, routes and vehicles (public transport info)
CREATE POLICY "Anyone can view bus stops" ON public.bus_stops FOR SELECT USING (true);
CREATE POLICY "Anyone can view bus routes" ON public.bus_routes FOR SELECT USING (true);
CREATE POLICY "Anyone can view route stops" ON public.route_stops FOR SELECT USING (true);
CREATE POLICY "Anyone can view active vehicles" ON public.vehicles FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view vehicle positions" ON public.vehicle_positions FOR SELECT USING (true);

-- Only authenticated users (drivers) can update vehicles
CREATE POLICY "Drivers can update their vehicle" ON public.vehicles 
  FOR UPDATE USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can insert vehicle positions" ON public.vehicle_positions 
  FOR INSERT WITH CHECK (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE driver_id = auth.uid())
  );

-- Enable realtime for vehicle positions
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_positions;
ALTER TABLE public.vehicle_positions REPLICA IDENTITY FULL;

-- Trigger for updated_at on vehicles
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for Douala
INSERT INTO public.bus_stops (name, latitude, longitude, address) VALUES
  ('Marché Central', 4.0483, 9.7043, 'Boulevard de la Liberté'),
  ('Akwa Palace', 4.0511, 9.6920, 'Rue Joss'),
  ('Bonanjo', 4.0420, 9.6950, 'Avenue Charles de Gaulle'),
  ('Bepanda', 4.0650, 9.7200, 'Carrefour Bepanda'),
  ('Ndokoti', 4.0380, 9.7480, 'Rond-point Ndokoti'),
  ('Bonabéri', 4.0750, 9.6700, 'Pont du Wouri'),
  ('Deido', 4.0600, 9.6850, 'Carrefour Deido'),
  ('New Bell', 4.0350, 9.7150, 'Quartier New Bell');

INSERT INTO public.bus_routes (name, description, color) VALUES
  ('Ligne 1 - Centre', 'Marché Central ↔ Bonanjo', '#FFD42F'),
  ('Ligne 2 - Est', 'Akwa ↔ Ndokoti', '#4CAF50'),
  ('Ligne 3 - Ouest', 'Deido ↔ Bonabéri', '#2196F3');

-- Link stops to routes
INSERT INTO public.route_stops (route_id, stop_id, stop_order, arrival_time)
SELECT r.id, s.id, 1, '06:00'::TIME
FROM public.bus_routes r, public.bus_stops s
WHERE r.name = 'Ligne 1 - Centre' AND s.name = 'Marché Central';

INSERT INTO public.route_stops (route_id, stop_id, stop_order, arrival_time)
SELECT r.id, s.id, 2, '06:15'::TIME
FROM public.bus_routes r, public.bus_stops s
WHERE r.name = 'Ligne 1 - Centre' AND s.name = 'Bonanjo';

-- Sample vehicles
INSERT INTO public.vehicles (vehicle_type, plate_number, capacity, destination, status) VALUES
  ('bus', 'LT-1234-A', 40, 'Bonanjo', 'available'),
  ('bus', 'LT-5678-B', 40, 'Ndokoti', 'available'),
  ('taxi', 'LT-9012-C', 4, 'Akwa Palace', 'available'),
  ('taxi', 'LT-3456-D', 4, 'Bepanda', 'full'),
  ('taxi', 'LT-7890-E', 4, NULL, 'private');

-- Sample positions for vehicles
INSERT INTO public.vehicle_positions (vehicle_id, latitude, longitude, heading, speed)
SELECT id, 4.0500, 9.7050, 45, 25 FROM public.vehicles WHERE plate_number = 'LT-1234-A';
INSERT INTO public.vehicle_positions (vehicle_id, latitude, longitude, heading, speed)
SELECT id, 4.0420, 9.7400, 180, 30 FROM public.vehicles WHERE plate_number = 'LT-5678-B';
INSERT INTO public.vehicle_positions (vehicle_id, latitude, longitude, heading, speed)
SELECT id, 4.0550, 9.6900, 90, 15 FROM public.vehicles WHERE plate_number = 'LT-9012-C';
INSERT INTO public.vehicle_positions (vehicle_id, latitude, longitude, heading, speed)
SELECT id, 4.0620, 9.7180, 270, 0 FROM public.vehicles WHERE plate_number = 'LT-3456-D';
INSERT INTO public.vehicle_positions (vehicle_id, latitude, longitude, heading, speed)
SELECT id, 4.0380, 9.7100, 0, 20 FROM public.vehicles WHERE plate_number = 'LT-7890-E';