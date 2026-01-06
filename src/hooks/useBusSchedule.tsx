import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduleStop {
  id: string;
  stopName: string;
  stopAddress: string | null;
  arrivalTime: string | null;
  stopOrder: number;
  latitude: number;
  longitude: number;
}

export interface RouteSchedule {
  routeId: string;
  routeName: string;
  routeDescription: string | null;
  color: string;
  stops: ScheduleStop[];
}

export const useBusSchedule = () => {
  const [schedules, setSchedules] = useState<RouteSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      setIsLoading(true);

      // Fetch routes
      const { data: routes, error: routesError } = await supabase
        .from('bus_routes')
        .select('*')
        .eq('is_active', true);

      if (routesError) {
        console.error('Error fetching routes:', routesError);
        setIsLoading(false);
        return;
      }

      // Fetch route stops with stop details
      const { data: routeStops, error: stopsError } = await supabase
        .from('route_stops')
        .select(`
          id,
          route_id,
          stop_order,
          arrival_time,
          bus_stops (
            id,
            name,
            address,
            latitude,
            longitude
          )
        `)
        .order('stop_order', { ascending: true });

      if (stopsError) {
        console.error('Error fetching route stops:', stopsError);
        setIsLoading(false);
        return;
      }

      // Build schedules
      const routeSchedules: RouteSchedule[] = (routes || []).map((route) => {
        const stops = (routeStops || [])
          .filter((rs) => rs.route_id === route.id)
          .map((rs) => {
            const stop = rs.bus_stops as any;
            return {
              id: rs.id,
              stopName: stop?.name || 'Arrêt inconnu',
              stopAddress: stop?.address,
              arrivalTime: rs.arrival_time,
              stopOrder: rs.stop_order,
              latitude: stop?.latitude || 0,
              longitude: stop?.longitude || 0,
            };
          })
          .sort((a, b) => a.stopOrder - b.stopOrder);

        return {
          routeId: route.id,
          routeName: route.name,
          routeDescription: route.description,
          color: route.color || '#FFD42F',
          stops,
        };
      });

      setSchedules(routeSchedules);
      setIsLoading(false);
    };

    fetchSchedules();
  }, []);

  return { schedules, isLoading };
};
