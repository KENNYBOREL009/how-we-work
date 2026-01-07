import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClientSignal {
  id: string;
  user_id: string | null;
  latitude: number;
  longitude: number;
  people_count: number;
  created_at: string;
  expires_at: string;
}

export interface SignalCluster {
  id: string;
  latitude: number;
  longitude: number;
  totalPeople: number;
  signalCount: number;
  signals: ClientSignal[];
}

const CLUSTER_RADIUS_KM = 0.3; // 300m clustering radius

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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
}

function clusterSignals(signals: ClientSignal[]): SignalCluster[] {
  const clusters: SignalCluster[] = [];
  const used = new Set<string>();

  signals.forEach((signal) => {
    if (used.has(signal.id)) return;

    const cluster: ClientSignal[] = [signal];
    used.add(signal.id);

    signals.forEach((other) => {
      if (used.has(other.id)) return;
      const dist = getDistanceKm(
        signal.latitude,
        signal.longitude,
        other.latitude,
        other.longitude
      );
      if (dist <= CLUSTER_RADIUS_KM) {
        cluster.push(other);
        used.add(other.id);
      }
    });

    const avgLat = cluster.reduce((sum, s) => sum + s.latitude, 0) / cluster.length;
    const avgLng = cluster.reduce((sum, s) => sum + s.longitude, 0) / cluster.length;
    const totalPeople = cluster.reduce((sum, s) => sum + s.people_count, 0);

    clusters.push({
      id: signal.id,
      latitude: avgLat,
      longitude: avgLng,
      totalPeople,
      signalCount: cluster.length,
      signals: cluster,
    });
  });

  return clusters;
}

export const useClientSignals = () => {
  const [signals, setSignals] = useState<ClientSignal[]>([]);
  const [clusters, setClusters] = useState<SignalCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSignals = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('client_signals')
        .select('*')
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const signalsData = (data || []) as ClientSignal[];
      setSignals(signalsData);
      setClusters(clusterSignals(signalsData));
    } catch (error) {
      console.error('Error fetching client signals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('client-signals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_signals',
        },
        () => {
          // Refetch on any change
          fetchSignals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSignals]);

  // Auto-cleanup expired signals every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setSignals((prev) => {
        const filtered = prev.filter((s) => new Date(s.expires_at) > now);
        setClusters(clusterSignals(filtered));
        return filtered;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    signals,
    clusters,
    isLoading,
    refetch: fetchSignals,
    totalPeopleWaiting: signals.reduce((sum, s) => sum + s.people_count, 0),
    hotspotCount: clusters.length,
  };
};
