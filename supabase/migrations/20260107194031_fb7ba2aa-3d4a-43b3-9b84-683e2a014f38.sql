-- Corriger les policies qui permettent INSERT/UPDATE avec true

-- Supprimer la policy ALL sur user_points (trop permissive)
DROP POLICY IF EXISTS "System can manage points" ON public.user_points;

-- Créer une policy INSERT restrictive (via trigger seulement)
CREATE POLICY "System creates user points"
ON public.user_points FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy UPDATE limitée
CREATE POLICY "Users cannot directly update points"
ON public.user_points FOR UPDATE
USING (false);

-- Corriger demand_signals pour exiger l'authentification
DROP POLICY IF EXISTS "Users can create signals" ON public.demand_signals;

CREATE POLICY "Authenticated users can create signals"
ON public.demand_signals FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR auth.uid() = user_id));

-- Corriger driver_intentions pour ne pas avoir de policy ALL
DROP POLICY IF EXISTS "Drivers can manage own intentions" ON public.driver_intentions;

CREATE POLICY "Drivers can view own intentions"
ON public.driver_intentions FOR SELECT
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create intentions"
ON public.driver_intentions FOR INSERT
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own intentions"
ON public.driver_intentions FOR UPDATE
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete own intentions"
ON public.driver_intentions FOR DELETE
USING (auth.uid() = driver_id);

-- Corriger passenger_routines de même
DROP POLICY IF EXISTS "Users can manage own routines" ON public.passenger_routines;

CREATE POLICY "Users can view own routines"
ON public.passenger_routines FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create routines"
ON public.passenger_routines FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines"
ON public.passenger_routines FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines"
ON public.passenger_routines FOR DELETE
USING (auth.uid() = user_id);