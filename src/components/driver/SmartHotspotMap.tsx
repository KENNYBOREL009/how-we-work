import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useClientSignals, SignalCluster } from '@/hooks/useClientSignals';
import { useTrafficIntelligence } from '@/hooks/useTrafficIntelligence';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Loader2, Brain, Sparkles, TrendingUp } from 'lucide-react';

interface SmartHotspotMapProps {
  className?: string;
  height?: string;
  onAnalyze?: () => void;
}

export const SmartHotspotMap = ({ 
  className = '', 
  height = '400px',
  onAnalyze
}: SmartHotspotMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const predictionMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [showPredictions, setShowPredictions] = useState(true);

  const { clusters, totalPeopleWaiting, hotspotCount, isLoading } = useClientSignals();
  const { predictions, isAnalyzing, predictTraffic } = useTrafficIntelligence();

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapToken(data.token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      }
    };
    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapToken || map.current) return;

    mapboxgl.accessToken = mapToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [9.7043, 4.0511], // Douala center
      zoom: 12,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapToken]);

  // Update real-time signal markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for each cluster
    clusters.forEach((cluster) => {
      const el = createHotspotMarker(cluster, 'realtime');
      
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([cluster.longitude, cluster.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <p class="font-bold text-red-600">${cluster.totalPeople} personne(s) en attente</p>
              <p class="text-sm text-gray-500">${cluster.signalCount} signal(s) actifs</p>
              <p class="text-xs text-gray-400 mt-1">Données en temps réel</p>
            </div>
          `)
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [clusters, mapLoaded]);

  // Update prediction markers
  useEffect(() => {
    if (!map.current || !mapLoaded || !showPredictions) return;

    // Clear prediction markers
    predictionMarkersRef.current.forEach((marker) => marker.remove());
    predictionMarkersRef.current = [];

    // Add prediction markers
    predictions.forEach((pred) => {
      const el = createPredictionMarker(pred);
      
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pred.zone_lng, pred.zone_lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <p class="font-bold text-purple-600">${pred.zone_name}</p>
              <p class="text-sm">Demande prédite: <strong>${pred.predicted_demand}</strong></p>
              <p class="text-xs text-gray-500 mt-1">Confiance: ${Math.round(pred.confidence * 100)}%</p>
              <p class="text-xs text-gray-400 mt-1">${pred.reason}</p>
            </div>
          `)
        )
        .addTo(map.current!);

      predictionMarkersRef.current.push(marker);
    });
  }, [predictions, mapLoaded, showPredictions]);

  const createHotspotMarker = (cluster: SignalCluster, type: string): HTMLDivElement => {
    const el = document.createElement('div');
    el.className = 'hotspot-marker';
    
    const size = Math.min(40 + cluster.totalPeople * 8, 80);
    const intensity = Math.min(0.4 + cluster.totalPeople * 0.1, 1);
    
    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(239, 68, 68, ${intensity}) 0%, rgba(239, 68, 68, 0.2) 70%, transparent 100%);
      border: 2px solid rgba(239, 68, 68, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${Math.min(14 + cluster.totalPeople, 20)}px;
      cursor: pointer;
      animation: pulse 2s infinite;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
    `;
    
    el.innerHTML = `${cluster.totalPeople}`;
    
    return el;
  };

  const createPredictionMarker = (pred: { predicted_demand: number; confidence: number }): HTMLDivElement => {
    const el = document.createElement('div');
    el.className = 'prediction-marker';
    
    const size = Math.min(35 + pred.predicted_demand * 3, 60);
    const opacity = 0.3 + pred.confidence * 0.5;
    
    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(147, 51, 234, ${opacity}) 0%, rgba(147, 51, 234, 0.1) 70%, transparent 100%);
      border: 2px dashed rgba(147, 51, 234, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      animation: glow 3s infinite;
    `;
    
    el.innerHTML = `<span style="display:flex;align-items:center;gap:2px;">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
      ${pred.predicted_demand}
    </span>`;
    
    return el;
  };

  const handleAnalyze = async () => {
    await predictTraffic();
    onAnalyze?.();
  };

  if (!mapToken) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted rounded-lg ${className}`}
        style={{ height }}
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {/* Map container */}
      <div ref={mapContainer} style={{ height }} />

      {/* Stats overlay */}
      <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-2">
        <Badge variant="secondary" className="bg-background/90 backdrop-blur">
          <Users className="w-3 h-3 mr-1 text-red-500" />
          {totalPeopleWaiting} en attente
        </Badge>
        <Badge variant="secondary" className="bg-background/90 backdrop-blur">
          <MapPin className="w-3 h-3 mr-1 text-red-500" />
          {hotspotCount} zones actives
        </Badge>
        {predictions.length > 0 && (
          <Badge variant="secondary" className="bg-background/90 backdrop-blur">
            <TrendingUp className="w-3 h-3 mr-1 text-purple-500" />
            {predictions.length} prédictions IA
          </Badge>
        )}
      </div>

      {/* AI Controls */}
      <div className="absolute bottom-2 left-2 right-2 flex gap-2">
        <Button 
          size="sm" 
          variant="secondary"
          className="bg-background/90 backdrop-blur"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-1 text-purple-500" />
          )}
          Analyser IA
        </Button>
        
        <Button 
          size="sm" 
          variant={showPredictions ? "default" : "secondary"}
          className={showPredictions ? "" : "bg-background/90 backdrop-blur"}
          onClick={() => setShowPredictions(!showPredictions)}
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Prédictions
        </Button>
      </div>

      {/* Loading overlay */}
      {(isLoading || isAnalyzing) && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            {isAnalyzing && <span className="text-sm">Analyse IA en cours...</span>}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isAnalyzing && clusters.length === 0 && predictions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/90 backdrop-blur rounded-lg px-4 py-2 text-center">
            <p className="text-sm text-muted-foreground">Aucun signal actif</p>
            <p className="text-xs text-muted-foreground mt-1">Lancez l'analyse IA pour les prédictions</p>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes glow {
          0% { box-shadow: 0 0 5px rgba(147, 51, 234, 0.3); }
          50% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.6); }
          100% { box-shadow: 0 0 5px rgba(147, 51, 234, 0.3); }
        }
      `}</style>
    </div>
  );
};
