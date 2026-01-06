-- Table pour les arrêts favoris des utilisateurs
CREATE TABLE public.favorite_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stop_id UUID NOT NULL REFERENCES public.bus_stops(id) ON DELETE CASCADE,
  notify_on_approach BOOLEAN DEFAULT true,
  notify_radius_meters INTEGER DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, stop_id)
);

-- Table pour les notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'alert', 'bus_approach', 'trip_update')),
  is_read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.favorite_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for favorite_stops
CREATE POLICY "Users can view their favorite stops" ON public.favorite_stops 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorite stops" ON public.favorite_stops 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their favorite stops" ON public.favorite_stops 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their favorite stops" ON public.favorite_stops 
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;