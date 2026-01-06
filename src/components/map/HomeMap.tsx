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
    if (!map.current || !userLocation || !map.current.isStyleLoaded()) return;

    const sourceId = 'visibility-radius';
    const layerId = 'visibility-radius-layer';
    const borderLayerId = 'visibility-radius-border';

    // Supprime l'ancien cercle s'il existe
    try {
      if (map.current.getLayer(borderLayerId)) {
        map.current.removeLayer(borderLayerId);
      }
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    } catch (e) {
      // Style might not be loaded yet, ignore
      return;
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
      const isPrivate = vehicle.ride_mode === 'privatisation';
      const availableSeats = (vehicle.capacity || 4) - (vehicle.current_passengers || 0);
      const canJoin = isSharedRide && availableSeats > 0 && vehicle.destination;
      const hasDestination = Boolean(vehicle.destination);
      
      // Couleur basée sur le mode de course
      const markerColor = isSharedRide 
        ? '#8b5cf6'
        : isPrivate 
        ? '#f59e0b'
        : '#FFD42F';

      const el = document.createElement('div');
      el.className = 'taxi-marker-enhanced';
      el.innerHTML = `
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
        ">
          ${hasDestination ? `
            <div style="
              position: absolute;
              bottom: 100%;
              left: 50%;
              transform: translateX(-50%);
              margin-bottom: 4px;
              background: linear-gradient(135deg, ${isSharedRide ? '#8b5cf6' : '#1a1a2e'} 0%, ${isSharedRide ? '#7c3aed' : '#414042'} 100%);
              color: ${isSharedRide ? '#fff' : '#FFD42F'};
              font-size: 11px;
              font-weight: 700;
              padding: 6px 10px;
              border-radius: 10px;
              white-space: nowrap;
              max-width: 140px;
              overflow: hidden;
              text-overflow: ellipsis;
              box-shadow: 0 4px 15px rgba(0,0,0,0.3);
              border: 2px solid ${isSharedRide ? '#a78bfa' : '#FFD42F'};
              animation: float 2s ease-in-out infinite;
            ">
              <span style="display: flex; align-items: center; gap: 4px;">
                ${isSharedRide ? '<span style="font-size: 12px;">👥</span>' : '<span style="font-size: 12px;">📍</span>'}
                ${vehicle.destination}
              </span>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 8px solid ${isSharedRide ? '#8b5cf6' : '#1a1a2e'};
              margin-bottom: -2px;
            "></div>
          ` : ''}
          
          <div style="
            position: relative;
            width: 44px;
            height: 44px;
            background: linear-gradient(145deg, ${markerColor}, ${isSharedRide ? '#7c3aed' : isPrivate ? '#d97706' : '#e6c029'});
            border: 3px solid #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 
              0 4px 15px rgba(0,0,0,0.3),
              inset 0 2px 4px rgba(255,255,255,0.3);
            transition: all 0.3s ease;
          ">
            ${isSharedRide ? `
              <div style="
                position: absolute;
                top: -6px;
                right: -6px;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white;
                font-size: 11px;
                font-weight: 800;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                z-index: 10;
                box-shadow: 0 2px 8px rgba(34, 197, 94, 0.5);
              ">
                ${availableSeats}
              </div>
            ` : ''}
            
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${isSharedRide ? '#fff' : '#1a1a2e'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m-4 0H3m4 0h10m0 0a2 2 0 104 0m-4 0a2 2 0 114 0m0 0h2M3 11l2-5h9l4 5h1a2 2 0 012 2v4h-2"/>
            </svg>
          </div>
          
          ${!hasDestination ? `
            <div style="
              margin-top: 4px;
              background: rgba(34, 197, 94, 0.9);
              color: white;
              font-size: 9px;
              font-weight: 700;
              padding: 3px 8px;
              border-radius: 6px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">
              Libre
            </div>
          ` : ''}
        </div>
        <style>
          @keyframes float {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(-3px); }
          }
          .taxi-marker-enhanced:hover > div > div:last-of-type {
            transform: scale(1.1);
          }
        </style>
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
        <div style="padding: 12px; min-width: 200px; font-family: system-ui, sans-serif;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 12px;
              background: linear-gradient(135deg, ${markerColor}, ${isSharedRide ? '#7c3aed' : '#e6c029'});
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isSharedRide ? '#fff' : '#1a1a2e'}" stroke-width="2.5">
                <path d="M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m-4 0H3m4 0h10m0 0a2 2 0 104 0m-4 0a2 2 0 114 0m0 0h2M3 11l2-5h9l4 5h1a2 2 0 012 2v4h-2"/>
              </svg>
            </div>
            <div>
              <strong style="color: #1a1a2e; font-size: 15px; display: block;">${vehicle.plate_number}</strong>
              <span style="font-size: 11px; color: #666;">
                ${isSharedRide ? '👥 Confort Partagé' : isPrivate ? '⭐ Privé' : '🚕 Taxi Standard'}
              </span>
            </div>
          </div>
          ${vehicle.destination ? `
            <div style="
              background: linear-gradient(135deg, #f8f9fa, #e9ecef);
              border-radius: 10px;
              padding: 10px;
              margin-bottom: 10px;
            ">
              <p style="margin: 0; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">
                Destination
              </p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #1a1a2e; font-weight: 700;">
                📍 ${vehicle.destination}
              </p>
            </div>
          ` : `
            <div style="
              background: linear-gradient(135deg, #d4edda, #c3e6cb);
              border-radius: 10px;
              padding: 10px;
              margin-bottom: 10px;
              text-align: center;
            ">
              <p style="margin: 0; font-size: 13px; color: #155724; font-weight: 600;">
                ✅ Disponible
              </p>
            </div>
          `}
          
          <div style="display: flex; gap: 8px; margin-bottom: 10px;">
            <div style="flex: 1; text-align: center; padding: 8px; background: #f8f9fa; border-radius: 8px;">
              <p style="margin: 0; font-size: 10px; color: #888;">Places</p>
              <p style="margin: 2px 0 0; font-size: 14px; font-weight: 700; color: #1a1a2e;">${vehicle.capacity || 4}</p>
            </div>
            ${isSharedRide ? `
              <div style="flex: 1; text-align: center; padding: 8px; background: #8b5cf610; border-radius: 8px; border: 1px solid #8b5cf630;">
                <p style="margin: 0; font-size: 10px; color: #8b5cf6;">Dispo</p>
                <p style="margin: 2px 0 0; font-size: 14px; font-weight: 700; color: #8b5cf6;">${availableSeats}</p>
              </div>
            ` : ''}
            ${vehicle.speed ? `
              <div style="flex: 1; text-align: center; padding: 8px; background: #f8f9fa; border-radius: 8px;">
                <p style="margin: 0; font-size: 10px; color: #888;">Vitesse</p>
                <p style="margin: 2px 0 0; font-size: 14px; font-weight: 700; color: #1a1a2e;">${Math.round(vehicle.speed)} km/h</p>
              </div>
            ` : ''}
          </div>
          
          ${sharedInfo}
          
          <button 
            onclick="window.dispatchEvent(new CustomEvent('selectTaxi', { detail: JSON.stringify({ id: '${vehicle.id}', canJoin: ${canJoin} }) }))"
            style="
              width: 100%;
              padding: 12px;
              background: linear-gradient(135deg, ${isSharedRide ? '#8b5cf6' : '#FFD42F'}, ${isSharedRide ? '#7c3aed' : '#e6c029'});
              color: ${isSharedRide ? '#fff' : '#1a1a2e'};
              border: none;
              border-radius: 12px;
              font-weight: 700;
              font-size: 14px;
              cursor: pointer;
              box-shadow: 0 4px 12px ${isSharedRide ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 212, 47, 0.4)'};
            "
          >
            ${canJoin ? '👥 Rejoindre la course' : '🚕 Choisir ce taxi'}
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
