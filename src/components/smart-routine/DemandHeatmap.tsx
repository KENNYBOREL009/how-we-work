import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import type { DemandPrediction, CityZone } from '@/hooks/useSmartRoutine';

interface DemandHeatmapProps {
  predictions: DemandPrediction[];
  zones: CityZone[];
  selectedHour: number;
  onHourChange: (hour: number) => void;
  className?: string;
}

const demandColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const DemandHeatmap: React.FC<DemandHeatmapProps> = ({
  predictions,
  zones,
  selectedHour,
  onHourChange,
  className,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setIsLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [9.7043, 4.0600],
      zoom: 11,
    });

    map.current = mapInstance;

    mapInstance.on('load', () => {
      setIsLoading(false);
    });

    return () => {
      mapInstance.remove();
    };
  }, [mapboxToken]);

  // Update markers when predictions change
  useEffect(() => {
    if (!map.current || isLoading) return;

    // Clear existing markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    // Add prediction markers
    predictions.forEach((pred) => {
      const el = document.createElement('div');
      el.className = 'demand-marker';
      el.innerHTML = `
        <div class="demand-bubble" style="background-color: ${demandColors[pred.demand_level]}">
          <div class="demand-count">${pred.predicted_demand}</div>
          <div class="demand-label">demandes</div>
        </div>
        <div class="zone-name">${pred.zone_name}</div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pred.center_lng, pred.center_lat])
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [predictions, isLoading]);

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className={cn('relative rounded-xl overflow-hidden bg-card border', className)}>
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-semibold">Météo des Courses</span>
            </div>
            <div className="text-sm text-muted-foreground capitalize">{tomorrowStr}</div>
          </div>
          
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[selectedHour]}
              onValueChange={([val]) => onHourChange(val)}
              min={5}
              max={23}
              step={1}
              className="flex-1"
            />
            <span className="font-mono text-sm font-medium w-12">{formatHour(selectedHour)}</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-background/95 backdrop-blur rounded-lg p-2 shadow-lg">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Forte</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Moyenne</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Faible</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <span>{predictions.filter(p => p.demand_level === 'high').length} zones haute demande</span>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-muted">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainer} className="h-[400px]" />

      {/* Styles */}
      <style>{`
        .demand-marker {
          text-align: center;
        }
        .demand-bubble {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        }
        .demand-count {
          font-size: 16px;
          line-height: 1;
        }
        .demand-label {
          font-size: 8px;
          opacity: 0.9;
        }
        .zone-name {
          font-size: 10px;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
          margin-top: 4px;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default DemandHeatmap;
