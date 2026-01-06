-- Drop the old constraint
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_trip_type_check;

-- Add new constraint with all ride modes
ALTER TABLE public.trips ADD CONSTRAINT trips_trip_type_check 
CHECK (trip_type = ANY (ARRAY['taxi'::text, 'bus'::text, 'reservation'::text, 'confort-partage'::text, 'privatisation'::text]));