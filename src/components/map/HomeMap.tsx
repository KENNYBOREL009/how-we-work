import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useVehicles, Vehicle } from '@/hooks/useVehicles';

interface HomeMapProps {
  onLocationFound?: (coords: { lat: number; lng: number }) => void;
  onVehicleClick?: (vehicle: Vehicle) => void;
  className?: string;
}

const statusColors: Record<string, string> = {
  available: '#22c55e',
  full: '#f59e0b',
  private: '#FFD42F',
  offline: '#6b7280',
};

const HomeMap: React.FC<HomeMapProps> = ({ onLocationFound, onVehicleClick, className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  
  const { vehicles } = useVehicles();

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

  const addVehicleMarkers = useCallback(() => {
    if (!map.current || !mapReady) return;

    clearMarkers();

    // Filter to show only taxis on main map
    const taxis = vehicles.filter(v => v.vehicle_type === 'taxi' && v.latitude && v.longitude);

    taxis.forEach((vehicle) => {
      if (!vehicle.latitude || !vehicle.longitude) return;

      const color = statusColors[vehicle.status] || statusColors.offline;

      const el = document.createElement('div');
      el.className = 'taxi-marker';
      el.innerHTML = `
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <div style="
            width: 32px;
            height: 32px;
            background: ${color};
            border: 3px solid #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 3px 12px rgba(0,0,0,0.4);
            transform: rotate(${vehicle.heading || 0}deg);
            transition: transform 0.3s ease;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#414042" stroke-width="2.5">
              <path d="M7 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0 -4 0M17 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0 -4 0M5 17h-3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"/>
            </svg>
          </div>
          ${vehicle.destination ? `
            <div style="
              margin-top: 4px;
              background: #414042;
              color: #FFD42F;
              font-size: 10px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 4px;
              white-space: nowrap;
              max-width: 80px;
              overflow: hidden;
              text-overflow: ellipsis;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
              → ${vehicle.destination}
            </div>
          ` : ''}
        </div>
      `;

      el.addEventListener('click', () => onVehicleClick?.(vehicle));

      const popupContent = `
        <div style="padding: 10px; min-width: 160px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: ${color};
            "></span>
            <strong style="color: #414042; font-size: 14px;">${vehicle.plate_number}</strong>
          </div>
          <p style="margin: 0; font-size: 12px; color: #666;">
            🚕 Taxi • ${vehicle.capacity} places
          </p>
          ${vehicle.destination ? `
            <p style="margin: 6px 0 0; font-size: 13px; color: #414042; font-weight: 500;">
              → <strong>${vehicle.destination}</strong>
            </p>
          ` : '<p style="margin: 6px 0 0; font-size: 12px; color: #888;">Destination libre</p>'}
          ${vehicle.speed ? `
            <p style="margin: 4px 0 0; font-size: 11px; color: #888;">
              ${Math.round(vehicle.speed)} km/h
            </p>
          ` : ''}
          <button 
            onclick="window.dispatchEvent(new CustomEvent('selectTaxi', { detail: '${vehicle.id}' }))"
            style="
              margin-top: 8px;
              width: 100%;
              padding: 8px;
              background: #FFD42F;
              color: #414042;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
            "
          >
            Choisir ce taxi
          </button>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([vehicle.longitude, vehicle.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupContent))
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [vehicles, mapReady, onVehicleClick, clearMarkers]);

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
      setMapReady(true);
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
      clearMarkers();
      resizeObserver.disconnect();
      mapInstance.remove();
    };
  }, [mapboxToken, onLocationFound, clearMarkers]);

  // Update markers when vehicles change
  useEffect(() => {
    addVehicleMarkers();
  }, [addVehicleMarkers]);

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

export default HomeMap;
