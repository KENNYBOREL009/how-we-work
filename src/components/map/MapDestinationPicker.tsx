import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MapDestinationPickerProps {
  onConfirm: (location: { lat: number; lng: number; name: string }) => void;
  onCancel: () => void;
  initialCenter?: { lat: number; lng: number };
  className?: string;
}

const MapDestinationPicker: React.FC<MapDestinationPickerProps> = ({
  onConfirm,
  onCancel,
  initialCenter = { lat: 4.0511, lng: 9.7043 },
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState(false);

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

  // Reverse geocode to get location name
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!mapboxToken) return;
    
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=fr`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        // Get the most relevant place name
        const place = data.features[0];
        const neighborhood = data.features.find((f: any) => f.place_type.includes('neighborhood'));
        const locality = data.features.find((f: any) => f.place_type.includes('locality'));
        
        const name = neighborhood?.text || locality?.text || place.place_name?.split(',')[0] || 'Position sélectionnée';
        setLocationName(name);
      } else {
        setLocationName('Position sélectionnée');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationName('Position sélectionnée');
    } finally {
      setIsGeocoding(false);
    }
  }, [mapboxToken]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 14,
    });

    map.current = mapInstance;

    // Add navigation controls
    mapInstance.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    // Create draggable marker
    const el = document.createElement('div');
    el.className = 'destination-marker';
    el.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translateY(-50%);
        cursor: grab;
      ">
        <div style="
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          animation: bounce 2s infinite;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style="
          width: 3px;
          height: 20px;
          background: linear-gradient(180deg, hsl(var(--primary)), transparent);
        "></div>
      </div>
      <style>
        @keyframes bounce {
          0%, 100% { transform: translateY(-50%); }
          50% { transform: translateY(-55%); }
        }
      </style>
    `;

    markerRef.current = new mapboxgl.Marker({ 
      element: el, 
      draggable: true,
      anchor: 'bottom'
    })
      .setLngLat([initialCenter.lng, initialCenter.lat])
      .addTo(mapInstance);

    // Handle marker drag
    markerRef.current.on('dragend', () => {
      const lngLat = markerRef.current?.getLngLat();
      if (lngLat) {
        setSelectedLocation({ lat: lngLat.lat, lng: lngLat.lng });
        reverseGeocode(lngLat.lat, lngLat.lng);
      }
    });

    // Handle map click to move marker
    mapInstance.on('click', (e) => {
      markerRef.current?.setLngLat([e.lngLat.lng, e.lngLat.lat]);
      setSelectedLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      reverseGeocode(e.lngLat.lat, e.lngLat.lng);
    });

    mapInstance.on('load', () => {
      setIsLoading(false);
      setSelectedLocation(initialCenter);
      reverseGeocode(initialCenter.lat, initialCenter.lng);
    });

    return () => {
      mapInstance.remove();
    };
  }, [mapboxToken, initialCenter, reverseGeocode]);

  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        name: locationName || 'Position sélectionnée'
      });
    }
  };

  return (
    <div className={cn("relative flex flex-col h-full", className)}>
      {/* Header instruction */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
        <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Positionnez votre destination</p>
              <p className="text-xs text-muted-foreground">
                Touchez la carte ou glissez le marqueur
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        <div ref={mapContainer} className="absolute inset-0" />
      </div>

      {/* Selected location info + actions */}
      <div className="p-4 bg-background border-t border-border space-y-3">
        {/* Location info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Destination</p>
            {isGeocoding ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-sm text-muted-foreground">Recherche...</span>
              </div>
            ) : (
              <p className="font-semibold text-sm truncate">{locationName || 'Sélectionnez un point'}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={onCancel}
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button
            className="flex-1 h-12"
            onClick={handleConfirm}
            disabled={!selectedLocation || isGeocoding}
          >
            <Check className="w-4 h-4 mr-2" />
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapDestinationPicker;
