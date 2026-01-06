import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Navigation, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TripMapStatus = 'approaching' | 'picked_up' | 'in_progress' | 'arriving' | 'arrived';

interface LiveTripMapProps {
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  driverCoords?: { lat: number; lng: number };
  status: TripMapStatus;
  className?: string;
}

const LiveTripMap: React.FC<LiveTripMapProps> = ({
  originCoords = { lat: 4.0511, lng: 9.7043 },
  destinationCoords = { lat: 4.0611, lng: 9.7243 },
  driverCoords,
  status,
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  
  // Simulate driver movement
  const [simulatedDriverPos, setSimulatedDriverPos] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setError('Carte indisponible');
        setIsLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Simulate driver position based on status
  useEffect(() => {
    if (!originCoords || !destinationCoords) return;

    const targetCoords = ['approaching', 'picked_up'].includes(status) ? originCoords : destinationCoords;
    const startCoords = status === 'approaching' 
      ? { lat: originCoords.lat - 0.008, lng: originCoords.lng - 0.008 }
      : originCoords;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.02;
      if (progress >= 1) {
        clearInterval(interval);
        setSimulatedDriverPos(targetCoords);
        return;
      }

      const lat = startCoords.lat + (targetCoords.lat - startCoords.lat) * progress;
      const lng = startCoords.lng + (targetCoords.lng - startCoords.lng) * progress;
      setSimulatedDriverPos({ lat, lng });
    }, 200);

    return () => clearInterval(interval);
  }, [status, originCoords, destinationCoords]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [originCoords.lng, originCoords.lat],
      zoom: 14,
      pitch: 30,
    });

    map.current = mapInstance;

    mapInstance.on('load', () => {
      setIsLoading(false);

      // Add origin marker
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat([originCoords.lng, originCoords.lat])
        .addTo(mapInstance);

      // Add destination marker
      new mapboxgl.Marker({ color: '#f59e0b' })
        .setLngLat([destinationCoords.lng, destinationCoords.lat])
        .addTo(mapInstance);

      // Add driver marker (custom element)
      const driverEl = document.createElement('div');
      driverEl.className = 'driver-marker';
      driverEl.innerHTML = `
        <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m-4 0H3m4 0h10m0 0a2 2 0 104 0m-4 0a2 2 0 114 0m0 0h2M3 11l2-6h14l2 6M5 11v6m14-6v6"/>
          </svg>
        </div>
      `;

      driverMarker.current = new mapboxgl.Marker(driverEl)
        .setLngLat([originCoords.lng - 0.005, originCoords.lat - 0.005])
        .addTo(mapInstance);

      // Fit bounds to show all markers
      const bounds = new mapboxgl.LngLatBounds()
        .extend([originCoords.lng, originCoords.lat])
        .extend([destinationCoords.lng, destinationCoords.lat]);

      mapInstance.fitBounds(bounds, { padding: 60 });

      // Draw route line
      mapInstance.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [originCoords.lng, originCoords.lat],
              [originCoords.lng + 0.005, originCoords.lat + 0.003],
              [destinationCoords.lng - 0.005, destinationCoords.lat - 0.003],
              [destinationCoords.lng, destinationCoords.lat]
            ]
          }
        }
      });

      mapInstance.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    });

    return () => {
      mapInstance.remove();
    };
  }, [mapboxToken, originCoords, destinationCoords]);

  // Update driver marker position
  useEffect(() => {
    const pos = driverCoords || simulatedDriverPos;
    if (driverMarker.current && pos) {
      driverMarker.current.setLngLat([pos.lng, pos.lat]);
      
      // Pan map to follow driver
      if (map.current) {
        map.current.panTo([pos.lng, pos.lat], { duration: 500 });
      }
    }
  }, [driverCoords, simulatedDriverPos]);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Status overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className={cn(
          "px-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-2 text-sm font-medium",
          status === 'arrived' ? "bg-green-500 text-white" : "bg-background/90"
        )}>
          {status === 'approaching' && (
            <>
              <Navigation className="w-4 h-4 text-primary animate-pulse" />
              <span>Chauffeur en approche...</span>
            </>
          )}
          {status === 'picked_up' && (
            <>
              <MapPin className="w-4 h-4 text-green-500" />
              <span>À bord - Départ imminent</span>
            </>
          )}
          {status === 'in_progress' && (
            <>
              <Navigation className="w-4 h-4 text-primary" />
              <span>En route vers destination</span>
            </>
          )}
          {status === 'arriving' && (
            <>
              <MapPin className="w-4 h-4 text-amber-500 animate-bounce" />
              <span>Arrivée imminente</span>
            </>
          )}
          {status === 'arrived' && (
            <>
              <MapPin className="w-4 h-4" />
              <span>Vous êtes arrivé !</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTripMap;
