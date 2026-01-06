-- Add operator field to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN operator text DEFAULT 'SOCATUR';

-- Add index for filtering by operator
CREATE INDEX idx_vehicles_operator ON public.vehicles(operator);