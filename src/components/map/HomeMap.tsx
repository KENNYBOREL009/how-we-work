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
  /** Rayon en km pour filtrer les taxis visibles (défaut: 2km) */
  visibilityRadius?: number;
}

const statusColors: Record<string, string> = {
  available: '#22c55e',
  full: '#f59e0b',
  private: '#FFD42F',
  offline: '#6b7280',
};

const rideModeColors: Record<string, string> = {
  'standard': '#22c55e',
  'confort-partage': '#8b5cf6', // Violet pour shared
  'privatisation': '#FFD42F',
};

// Calcule la distance entre deux points en km (formule Haversine)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const HomeMap: React.FC<HomeMapProps> = ({ 
  onLocationFound, 
  onVehicleClick, 
  className = '',
  visibilityRadius = 2, // 2km par défaut
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const radiusCircleRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
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

  // Dessine le cercle de visibilité sur la carte
  const drawRadiusCircle = useCallback(() => {
    if (!map.current || !userLocation) return;

    const sourceId = 'visibility-radius';
    const layerId = 'visibility-radius-layer';
    const borderLayerId = 'visibility-radius-border';

    // Supprime l'ancien cercle s'il existe
    if (map.current.getLayer(borderLayerId)) {
      map.current.removeLayer(borderLayerId);
    }
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Crée un cercle GeoJSON
    const points = 64;
    const coords: [number, number][] = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = (visibilityRadius / 111.32) * Math.cos(angle);
      const dy = (visibilityRadius / (111.32 * Math.cos((userLocation.lat * Math.PI) / 180))) * Math.sin(angle);
      coords.push([userLocation.lng + dy, userLocation.lat + dx]);
    }

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      },
    });

    map.current.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#FFD42F',
        'fill-opacity': 0.08,
      },
    });

    map.current.addLayer({
      id: borderLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#FFD42F',
        'line-width': 2,
        'line-opacity': 0.5,
        'line-dasharray': [3, 2],
      },
    });

    radiusCircleRef.current = sourceId;
  }, [userLocation, visibilityRadius]);

  const addVehicleMarkers = useCallback(() => {
    if (!map.current || !mapReady) return;

    clearMarkers();

    // Filtre les taxis par zone géographique
    let taxis = vehicles.filter(v => v.vehicle_type === 'taxi' && v.latitude && v.longitude);
    
    // Si on a la position utilisateur, filtre par distance
    if (userLocation) {
      taxis = taxis.filter(vehicle => {
        if (!vehicle.latitude || !vehicle.longitude) return false;
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          vehicle.latitude,
          vehicle.longitude
        );
        return distance <= visibilityRadius;
      });
    }

    taxis.forEach((vehicle) => {
      if (!vehicle.latitude || !vehicle.longitude) return;

      const isSharedRide = vehicle.ride_mode === 'confort-partage';
      const availableSeats = (vehicle.capacity || 4) - (vehicle.current_passengers || 0);
      const canJoin = isSharedRide && availableSeats > 0 && vehicle.destination;
      
      // Couleur basée sur le mode de course
      const color = isSharedRide 
        ? rideModeColors['confort-partage']
        : statusColors[vehicle.status] || statusColors.offline;

      const el = document.createElement('div');
      el.className = 'taxi-marker';
      el.innerHTML = `
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          ${isSharedRide ? `
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              background: #22c55e;
              color: white;
              font-size: 10px;
              font-weight: 700;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid white;
              z-index: 10;
            ">
              ${availableSeats}
            </div>
          ` : ''}
          <div style="
            width: 32px;
            height: 32px;
            background: ${color};
            border: 3px solid ${isSharedRide ? '#8b5cf6' : '#fff'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 3px 12px rgba(0,0,0,0.4);
            transform: rotate(${vehicle.heading || 0}deg);
            transition: transform 0.3s ease;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isSharedRide ? '#fff' : '#414042'}" stroke-width="2.5">
              <path d="M7 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0 -4 0M17 17m-2 0a2 2 0 1 0 4 0 2 2 0 1 0 -4 0M5 17h-3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"/>
            </svg>
          </div>
          ${vehicle.destination ? `
            <div style="
              margin-top: 4px;
              background: ${isSharedRide ? '#8b5cf6' : '#414042'};
              color: ${isSharedRide ? '#fff' : '#FFD42F'};
              font-size: 10px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 4px;
              white-space: nowrap;
              max-width: 100px;
              overflow: hidden;
              text-overflow: ellipsis;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
              ${isSharedRide ? '👥 ' : '→ '}${vehicle.destination}
            </div>
          ` : ''}
        </div>
      `;

      el.addEventListener('click', () => onVehicleClick?.(vehicle));

      const sharedInfo = isSharedRide ? `
        <div style="
          background: #8b5cf620;
          border: 1px solid #8b5cf6;
          border-radius: 8px;
          padding: 8px;
          margin: 8px 0;
        ">
          <p style="margin: 0; font-size: 11px; color: #8b5cf6; font-weight: 600;">
            🚗 Confort Partagé en cours
          </p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #666;">
            ${vehicle.current_passengers || 0}/${vehicle.capacity || 4} passagers • ${availableSeats} place${availableSeats > 1 ? 's' : ''} dispo
          </p>
          ${vehicle.shared_ride_origin ? `
            <p style="margin: 4px 0 0; font-size: 11px; color: #888;">
              De: ${vehicle.shared_ride_origin}
            </p>
          ` : ''}
          <p style="margin: 4px 0 0; font-size: 11px; color: #888;">
            Tarif: ${vehicle.shared_ride_fare_per_km || 200} FCFA/km
          </p>
        </div>
      ` : '';

      const popupContent = `
        <div style="padding: 10px; min-width: 180px;">
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
          ${sharedInfo}
          ${vehicle.speed ? `
            <p style="margin: 4px 0 0; font-size: 11px; color: #888;">
              ${Math.round(vehicle.speed)} km/h
            </p>
          ` : ''}
          <button 
            onclick="window.dispatchEvent(new CustomEvent('selectTaxi', { detail: JSON.stringify({ id: '${vehicle.id}', canJoin: ${canJoin} }) }))"
            style="
              margin-top: 8px;
              width: 100%;
              padding: 8px;
              background: ${isSharedRide ? '#8b5cf6' : '#FFD42F'};
              color: ${isSharedRide ? '#fff' : '#414042'};
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
            "
          >
            ${canJoin ? 'Rejoindre la course' : 'Choisir ce taxi'}
          </button>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([vehicle.longitude, vehicle.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupContent))
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [vehicles, mapReady, onVehicleClick, clearMarkers, userLocation, visibilityRadius]);

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
      trackUserLocation: false,
      showUserLocation: false,
      showUserHeading: false,
    });

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
      setUserLocation(coords);
      onLocationFound?.(coords);
    });

    return () => {
      clearMarkers();
      resizeObserver.disconnect();
      mapInstance.remove();
    };
  }, [mapboxToken, onLocationFound, clearMarkers]);

  // Dessine le cercle quand la position change
  useEffect(() => {
    if (mapReady && userLocation) {
      drawRadiusCircle();
    }
  }, [mapReady, userLocation, drawRadiusCircle]);

  // Update markers when vehicles or location change
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
      
      {/* Indicateur de zone */}
      {userLocation && (
        <div className="absolute top-4 left-4 glass rounded-lg px-3 py-2 z-10 text-xs font-medium text-foreground">
          🎯 Zone: {visibilityRadius} km
        </div>
      )}
    </div>
  );
};

export default HomeMap;
