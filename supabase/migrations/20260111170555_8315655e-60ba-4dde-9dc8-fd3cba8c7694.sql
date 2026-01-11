-- Fix vehicle_positions: Remove public access, restrict to legitimate users only

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view vehicle positions" ON public.vehicle_positions;

-- Create secure policy: Only drivers can see their own vehicle, passengers with active trips can see their driver
CREATE POLICY "Drivers can view their own vehicle position"
ON public.vehicle_positions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vehicles v 
    WHERE v.id = vehicle_positions.vehicle_id 
    AND v.driver_id = auth.uid()
  )
);

CREATE POLICY "Passengers can view their active trip vehicle"
ON public.vehicle_positions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trips t
    WHERE t.vehicle_id = vehicle_positions.vehicle_id
    AND t.user_id = auth.uid()
    AND t.status IN ('accepted', 'in_progress', 'driver_arrived')
  )
);

CREATE POLICY "Fleet owners can view their fleet vehicles"
ON public.vehicle_positions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM fleet_vehicles fv
    JOIN fleet_owners fo ON fo.id = fv.fleet_owner_id
    WHERE fv.vehicle_id = vehicle_positions.vehicle_id
    AND fo.user_id = auth.uid()
  )
);

-- Drivers can update their own vehicle position
CREATE POLICY "Drivers can update their vehicle position"
ON public.vehicle_positions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vehicles v 
    WHERE v.id = vehicle_positions.vehicle_id 
    AND v.driver_id = auth.uid()
  )
);

CREATE POLICY "Drivers can modify their vehicle position"
ON public.vehicle_positions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM vehicles v 
    WHERE v.id = vehicle_positions.vehicle_id 
    AND v.driver_id = auth.uid()
  )
);