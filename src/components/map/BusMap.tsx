import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Vehicle, BusStop } from '@/hooks/useVehicles';
import { createBusMarkerHTML } from './BusMarker';

interface BusMapProps {
  vehicles: Vehicle[];
  busStops: BusStop[];
  className?: string;
  onVehicleClick?: (vehicle: Vehicle) => void;
  onStopClick?: (stop: BusStop) => void;
}

const statusColors: Record<string, string> = {
  available: '#22c55e',
  full: '#f59e0b',
  offline: '#6b7280',
};

const BusMap: React.FC<BusMapProps> = ({
  vehicles,
  busStops,
  className = '',
  onVehicleClick,
  onStopClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Filtrer uniquement les bus
  const buses = vehicles.filter(v => v.vehicle_type === 'bus');

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

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  }, []);

  const addMarkers = useCallback(() => {
    if (!map.current) return;

    clearMarkers();

    // Add bus stop markers
    busStops.forEach((stop) => {
      const el = document.createElement('div');
      el.className = 'bus-stop-marker';
      el.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background: #414042;
          border: 3px solid #FFD42F;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFD42F" stroke-width="3">
            <circle cx="12" cy="12" r="8"/>
          </svg>
        </div>
      `;

      el.addEventListener('click', () => onStopClick?.(stop));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([stop.longitude, stop.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong style="color: #414042;">${stop.name}</strong>
              ${stop.address ? `<p style="margin: 4px 0 0; font-size: 12px; color: #666;">${stop.address}</p>` : ''}
            </div>
          `)
        )
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Add only BUS markers with realistic visuals
    buses.forEach((vehicle) => {
      if (!vehicle.latitude || !vehicle.longitude) return;

      const el = document.createElement('div');
      el.className = 'bus-vehicle-marker';
      el.innerHTML = createBusMarkerHTML(vehicle);

      el.addEventListener('click', () => onVehicleClick?.(vehicle));

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([vehicle.longitude, vehicle.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [buses, busStops, onVehicleClick, onStopClick, clearMarkers]);

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

    mapInstance.on('load', () => {
      setIsLoading(false);
      setTimeout(() => mapInstance.resize(), 0);

      mapInstance.setFog({
        color: 'rgb(30, 30, 40)',
        'high-color': 'rgb(20, 20, 30)',
        'horizon-blend': 0.1,
      });
    });

    return () => {
      clearMarkers();
      resizeObserver.disconnect();
      mapInstance.remove();
    };
  }, [mapboxToken, clearMarkers]);

  useEffect(() => {
    if (map.current && !isLoading) {
      addMarkers();
    }
  }, [buses, busStops, isLoading, addMarkers]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-2xl ${className}`}>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden min-h-[340px] ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full min-h-[340px]" />
    </div>
  );
};

export default BusMap;
