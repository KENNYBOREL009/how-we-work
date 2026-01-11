-- Table d'audit pour les courses (preuve en cas de litige)
CREATE TABLE public.ride_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'ARRIVED', 'TIMER_START', 'MOVED_AWAY', 'CLIENT_CONFIRMED', 'NO_SHOW', 'CANCELLED', 'PICKUP_STARTED', 'TRIP_COMPLETED'
  driver_lat DOUBLE PRECISION,
  driver_lng DOUBLE PRECISION,
  client_lat DOUBLE PRECISION,
  client_lng DOUBLE PRECISION,
  distance_meters INTEGER, -- Distance calculée entre chauffeur et client
  metadata JSONB DEFAULT '{}', -- Données additionnelles (ex: timer_remaining, reason)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide par course
CREATE INDEX idx_ride_audit_logs_ride_id ON public.ride_audit_logs(ride_id);
CREATE INDEX idx_ride_audit_logs_driver_id ON public.ride_audit_logs(driver_id);
CREATE INDEX idx_ride_audit_logs_created_at ON public.ride_audit_logs(created_at);

-- Enable RLS
ALTER TABLE public.ride_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Drivers can view their own audit logs"
ON public.ride_audit_logs
FOR SELECT
USING (auth.uid() = driver_id);

CREATE POLICY "Clients can view their ride audit logs"
ON public.ride_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = ride_audit_logs.ride_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert audit logs"
ON public.ride_audit_logs
FOR INSERT
WITH CHECK (true);

-- Table pour les messages client-chauffeur
CREATE TABLE public.ride_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'driver')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;

-- Index
CREATE INDEX idx_ride_messages_ride_id ON public.ride_messages(ride_id);

-- Enable RLS
ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Participants can view ride messages"
ON public.ride_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = ride_messages.ride_id
    AND (t.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM vehicles v WHERE v.id = t.vehicle_id AND v.driver_id = auth.uid()
    ))
  )
);

CREATE POLICY "Participants can send messages"
ON public.ride_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = ride_messages.ride_id
    AND (t.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM vehicles v WHERE v.id = t.vehicle_id AND v.driver_id = auth.uid()
    ))
  )
);

CREATE POLICY "Participants can mark messages as read"
ON public.ride_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = ride_messages.ride_id
    AND (t.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM vehicles v WHERE v.id = t.vehicle_id AND v.driver_id = auth.uid()
    ))
  )
);