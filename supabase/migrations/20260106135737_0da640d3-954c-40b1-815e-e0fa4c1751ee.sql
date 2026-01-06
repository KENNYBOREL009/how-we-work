-- Table légère pour les signaux clients (heatmap)
CREATE TABLE public.client_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  people_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes')
);

-- Index pour requêtes géographiques rapides
CREATE INDEX idx_client_signals_location ON public.client_signals (latitude, longitude);
CREATE INDEX idx_client_signals_expires ON public.client_signals (expires_at);

-- RLS
ALTER TABLE public.client_signals ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les signaux actifs (pour la heatmap chauffeur)
CREATE POLICY "Anyone can view active signals"
  ON public.client_signals FOR SELECT
  USING (expires_at > now());

-- Les utilisateurs connectés peuvent créer des signaux
CREATE POLICY "Authenticated users can create signals"
  ON public.client_signals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Signaux anonymes aussi permis (user_id NULL)
CREATE POLICY "Anonymous signals allowed"
  ON public.client_signals FOR INSERT
  WITH CHECK (user_id IS NULL);

-- Activer realtime pour les signaux
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_signals;