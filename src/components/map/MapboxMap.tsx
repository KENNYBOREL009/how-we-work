import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface MapboxMapProps {
  onLocationFound?: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ onLocationFound, className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Fetch Mapbox token from edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setError('Impossible de charger la carte');
        setIsLoading(false);
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [9.7043, 4.0511],
      zoom: 13,
      pitch: 45,
    });

    map.current = mapInstance;

    mapInstance.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });

    mapInstance.addControl(geolocateControl, 'top-right');

    const resizeObserver = new ResizeObserver(() => {
      mapInstance.resize();
    });
    resizeObserver.observe(mapContainer.current);

    mapInstance.on('error', (e) => {
      // Useful when WebGL/canvas sizing breaks silently
      console.error('Mapbox error:', (e as any)?.error ?? e);
    });

    mapInstance.on('load', () => {
      setIsLoading(false);

      // Ensure correct sizing after first paint
      setTimeout(() => mapInstance.resize(), 0);

      mapInstance.setFog({
        color: 'rgb(30, 30, 40)',
        'high-color': 'rgb(20, 20, 30)',
        'horizon-blend': 0.1,
      });

      geolocateControl.trigger();
    });

    geolocateControl.on('geolocate', (e: GeolocationPosition) => {
      const coords = { lat: e.coords.latitude, lng: e.coords.longitude };
      onLocationFound?.(coords);
    });

    return () => {
      resizeObserver.disconnect();
      mapInstance.remove();
    };
  }, [mapboxToken, onLocationFound]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-2xl ${className}`}>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default MapboxMap;
