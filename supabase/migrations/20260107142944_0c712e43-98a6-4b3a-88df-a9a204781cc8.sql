-- Add locked_amount to wallets for hold/escrow functionality
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS locked_amount numeric DEFAULT 0;

-- Create wallet_holds table for tracking individual holds
CREATE TABLE public.wallet_holds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  released_at TIMESTAMP WITH TIME ZONE,
  penalty_applied BOOLEAN DEFAULT false,
  penalty_amount numeric DEFAULT 0,
  penalty_reason TEXT
);

-- Enable RLS
ALTER TABLE public.wallet_holds ENABLE ROW LEVEL SECURITY;

-- Users can view their own holds
CREATE POLICY "Users can view their own holds"
ON public.wallet_holds
FOR SELECT
USING (
  wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
);

-- Add driver_arrival_at and client_confirmed_at to trips for countdown tracking
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS driver_arrival_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS client_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS no_show_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_penalty numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS driver_made_detour BOOLEAN DEFAULT false;

-- Function to create a wallet hold
CREATE OR REPLACE FUNCTION public.create_wallet_hold(
  p_user_id UUID,
  p_amount numeric,
  p_reason TEXT,
  p_trip_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance numeric;
  v_current_locked numeric;
  v_hold_id UUID;
BEGIN
  -- Get wallet info
  SELECT id, balance, COALESCE(locked_amount, 0) INTO v_wallet_id, v_current_balance, v_current_locked
  FROM wallets WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;
  
  -- Check available balance
  IF (v_current_balance - v_current_locked) < p_amount THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;
  
  -- Create the hold
  INSERT INTO wallet_holds (wallet_id, trip_id, amount, reason)
  VALUES (v_wallet_id, p_trip_id, p_amount, p_reason)
  RETURNING id INTO v_hold_id;
  
  -- Update locked amount on wallet
  UPDATE wallets 
  SET locked_amount = COALESCE(locked_amount, 0) + p_amount,
      updated_at = now()
  WHERE id = v_wallet_id;
  
  RETURN v_hold_id;
END;
$$;

-- Function to release a hold (with optional penalty)
CREATE OR REPLACE FUNCTION public.release_wallet_hold(
  p_hold_id UUID,
  p_apply_penalty BOOLEAN DEFAULT false,
  p_penalty_percent numeric DEFAULT 0,
  p_penalty_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_hold RECORD;
  v_penalty_amount numeric;
  v_refund_amount numeric;
BEGIN
  -- Get hold info
  SELECT * INTO v_hold FROM wallet_holds WHERE id = p_hold_id AND status = 'active';
  
  IF v_hold IS NULL THEN
    RAISE EXCEPTION 'Hold not found or already released';
  END IF;
  
  -- Calculate penalty
  IF p_apply_penalty THEN
    v_penalty_amount := v_hold.amount * (p_penalty_percent / 100);
    v_refund_amount := v_hold.amount - v_penalty_amount;
  ELSE
    v_penalty_amount := 0;
    v_refund_amount := v_hold.amount;
  END IF;
  
  -- Update hold status
  UPDATE wallet_holds
  SET status = 'released',
      released_at = now(),
      penalty_applied = p_apply_penalty,
      penalty_amount = v_penalty_amount,
      penalty_reason = p_penalty_reason
  WHERE id = p_hold_id;
  
  -- Update wallet locked amount
  UPDATE wallets
  SET locked_amount = GREATEST(0, COALESCE(locked_amount, 0) - v_hold.amount),
      updated_at = now()
  WHERE id = v_hold.wallet_id;
  
  -- If penalty applied, debit from balance and create transaction
  IF p_apply_penalty AND v_penalty_amount > 0 THEN
    UPDATE wallets
    SET balance = balance - v_penalty_amount,
        updated_at = now()
    WHERE id = v_hold.wallet_id;
    
    INSERT INTO wallet_transactions (wallet_id, amount, type, description)
    VALUES (v_hold.wallet_id, v_penalty_amount, 'debit', COALESCE(p_penalty_reason, 'Pénalité Annulation'));
  END IF;
END;
$$;