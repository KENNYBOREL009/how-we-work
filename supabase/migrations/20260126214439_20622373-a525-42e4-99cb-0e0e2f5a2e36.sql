-- Align trips table with TripModel structure
-- Add destination coordinates
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS destination_lat double precision,
ADD COLUMN IF NOT EXISTS destination_lng double precision;

-- Add estimated_fare (distinct from final fare)
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS estimated_fare integer;

-- Rename pickup_lat/lng to origin_lat/lng for consistency (keep aliases)
-- Actually, let's add origin columns and keep pickup for backward compatibility
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS origin_lat double precision,
ADD COLUMN IF NOT EXISTS origin_lng double precision;

-- Copy existing pickup data to origin if exists
UPDATE public.trips 
SET origin_lat = pickup_lat, origin_lng = pickup_lng 
WHERE origin_lat IS NULL AND pickup_lat IS NOT NULL;

-- Add final_fare column (the actual amount paid)
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS final_fare integer;

-- Create indexes for geo queries
CREATE INDEX IF NOT EXISTS idx_trips_origin_coords ON public.trips (origin_lat, origin_lng) WHERE origin_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_destination_coords ON public.trips (destination_lat, destination_lng) WHERE destination_lat IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.trips.estimated_fare IS 'Fare estimate before trip starts';
COMMENT ON COLUMN public.trips.final_fare IS 'Actual fare after trip completion';
COMMENT ON COLUMN public.trips.fare IS 'Legacy fare column - use estimated_fare/final_fare';