import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useClientSignals, SignalCluster } from '@/hooks/useClientSignals';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Loader2 } from 'lucide-react';

interface DriverHotspotMapProps {
  className?: string;
  height?: string;
}

export const DriverHotspotMap = ({ 
  className = '', 
  height = '300px' 
}: DriverHotspotMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapToken, setMapToken] = useState<string | null>(null);

  const { clusters, totalPeopleWaiting, hotspotCount, isLoading } = useClientSignals();

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

  // Update markers when clusters change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers for each cluster
    clusters.forEach((cluster) => {
      const el = createHotspotMarker(cluster);
      
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([cluster.longitude, cluster.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <p class="font-bold">${cluster.totalPeople} personne(s)</p>
              <p class="text-sm text-gray-500">${cluster.signalCount} signal(s)</p>
            </div>
          `)
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [clusters, mapLoaded]);

  const createHotspotMarker = (cluster: SignalCluster): HTMLDivElement => {
    const el = document.createElement('div');
    el.className = 'hotspot-marker';
    
    // Size based on people count
    const size = Math.min(40 + cluster.totalPeople * 8, 80);
    
    // Color intensity based on people count
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
      <div className="absolute top-2 left-2 right-2 flex gap-2">
        <Badge variant="secondary" className="bg-background/90 backdrop-blur">
          <Users className="w-3 h-3 mr-1" />
          {totalPeopleWaiting} en attente
        </Badge>
        <Badge variant="secondary" className="bg-background/90 backdrop-blur">
          <MapPin className="w-3 h-3 mr-1" />
          {hotspotCount} zones
        </Badge>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && clusters.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/90 backdrop-blur rounded-lg px-4 py-2 text-center">
            <p className="text-sm text-muted-foreground">Aucun signal actif</p>
          </div>
        </div>
      )}

      {/* CSS for animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
