-- Add driver default tracking columns
ALTER TABLE public.driver_reliability_scores 
ADD COLUMN IF NOT EXISTS cancellation_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ghosting_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_penalty_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspension_reason text;

-- Create function to handle driver defaults (cancellation or ghosting)
CREATE OR REPLACE FUNCTION public.handle_driver_default(
  p_driver_id uuid,
  p_default_type text, -- 'cancellation' or 'ghosting'
  p_hold_id uuid DEFAULT NULL,
  p_trip_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_score_penalty integer;
  v_current_score numeric;
  v_new_score numeric;
  v_is_blocked boolean := false;
  v_blocked_until timestamp with time zone := NULL;
  v_client_id uuid;
  v_result jsonb;
BEGIN
  -- Determine penalty based on default type
  IF p_default_type = 'ghosting' THEN
    v_score_penalty := 15;
  ELSIF p_default_type = 'cancellation' THEN
    v_score_penalty := 5;
  ELSE
    RAISE EXCEPTION 'Invalid default type: %', p_default_type;
  END IF;
  
  -- Get or create driver reliability score
  INSERT INTO driver_reliability_scores (driver_id, reliability_score)
  VALUES (p_driver_id, 100)
  ON CONFLICT (driver_id) DO NOTHING;
  
  -- Get current score
  SELECT reliability_score INTO v_current_score
  FROM driver_reliability_scores
  WHERE driver_id = p_driver_id;
  
  -- Calculate new score (minimum 0)
  v_new_score := GREATEST(0, v_current_score - v_score_penalty);
  
  -- Check for suspension threshold
  IF v_new_score < 50 THEN
    v_is_blocked := true;
    v_blocked_until := now() + interval '24 hours';
  END IF;
  
  -- Update driver reliability score
  UPDATE driver_reliability_scores
  SET 
    reliability_score = v_new_score,
    cancellation_count = CASE WHEN p_default_type = 'cancellation' THEN cancellation_count + 1 ELSE cancellation_count END,
    ghosting_count = CASE WHEN p_default_type = 'ghosting' THEN ghosting_count + 1 ELSE ghosting_count END,
    is_scheduling_blocked = CASE WHEN v_new_score < 80 THEN true ELSE is_scheduling_blocked END,
    blocked_until = COALESCE(v_blocked_until, blocked_until),
    last_penalty_at = now(),
    suspension_reason = CASE WHEN v_is_blocked THEN 'Score inférieur à 50 - Suspension 24h' ELSE NULL END,
    updated_at = now()
  WHERE driver_id = p_driver_id;
  
  -- Release client's wallet hold if provided
  IF p_hold_id IS NOT NULL THEN
    PERFORM release_wallet_hold(p_hold_id, false, 0, NULL);
  END IF;
  
  -- Get client ID for notification if trip provided
  IF p_trip_id IS NOT NULL THEN
    SELECT user_id INTO v_client_id FROM trips WHERE id = p_trip_id;
    
    -- Create notification for client
    IF v_client_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, data)
      VALUES (
        v_client_id,
        'Réservation annulée par le chauffeur',
        'Votre argent a été débloqué instantanément. Recherche d''un nouveau taxi prioritaire...',
        'driver_default',
        jsonb_build_object('trip_id', p_trip_id, 'default_type', p_default_type)
      );
    END IF;
  END IF;
  
  -- Create notification for driver
  INSERT INTO notifications (user_id, title, message, type, data)
  VALUES (
    p_driver_id,
    CASE 
      WHEN p_default_type = 'ghosting' THEN 'Pénalité sévère appliquée'
      ELSE 'Score de crédibilité réduit'
    END,
    CASE 
      WHEN v_is_blocked THEN 'Votre compte est suspendu pour 24h. Score trop bas.'
      WHEN v_new_score < 80 THEN 'Attention: Vous n''avez plus accès aux réservations. Score: ' || v_new_score::text || '/100'
      ELSE 'Votre score de crédibilité a baissé (-' || v_score_penalty::text || ' pts). Score actuel: ' || v_new_score::text || '/100'
    END,
    'score_penalty',
    jsonb_build_object(
      'default_type', p_default_type,
      'penalty', v_score_penalty,
      'new_score', v_new_score,
      'is_blocked', v_is_blocked
    )
  );
  
  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'previous_score', v_current_score,
    'new_score', v_new_score,
    'penalty_applied', v_score_penalty,
    'is_suspended', v_is_blocked,
    'blocked_until', v_blocked_until,
    'scheduling_blocked', v_new_score < 80
  );
  
  RETURN v_result;
END;
$$;

-- Create function to check if driver can see reservations
CREATE OR REPLACE FUNCTION public.can_driver_see_reservations(p_driver_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT reliability_score >= 80 
       AND (blocked_until IS NULL OR blocked_until < now())
       AND NOT COALESCE(is_scheduling_blocked, false)
     FROM driver_reliability_scores 
     WHERE driver_id = p_driver_id),
    true -- Default to true if no record exists
  );
$$;

-- Create function to check if driver is suspended
CREATE OR REPLACE FUNCTION public.is_driver_suspended(p_driver_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
       'is_suspended', blocked_until IS NOT NULL AND blocked_until > now(),
       'blocked_until', blocked_until,
       'reason', suspension_reason,
       'current_score', reliability_score
     )
     FROM driver_reliability_scores 
     WHERE driver_id = p_driver_id),
    jsonb_build_object('is_suspended', false, 'current_score', 100)
  );
$$;

-- Add unique constraint on driver_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'driver_reliability_scores_driver_id_key'
  ) THEN
    ALTER TABLE driver_reliability_scores ADD CONSTRAINT driver_reliability_scores_driver_id_key UNIQUE (driver_id);
  END IF;
END $$;