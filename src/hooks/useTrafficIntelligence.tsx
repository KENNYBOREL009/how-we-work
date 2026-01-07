import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TrafficPrediction {
  zone_name: string;
  zone_lat: number;
  zone_lng: number;
  predicted_demand: number;
  confidence: number;
  peak_time?: string;
  reason: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  zone_lat: number;
  zone_lng: number;
  predicted_demand: number;
  confidence_score: number;
  valid_until: string;
  is_active: boolean;
}

export interface LearnedRoute {
  id: string;
  origin_name: string;
  destination_name: string;
  trip_count: number;
  popularity_score: number;
  is_trending: boolean;
  avg_fare?: number;
}

export const useTrafficIntelligence = () => {
  const [predictions, setPredictions] = useState<TrafficPrediction[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [learnedRoutes, setLearnedRoutes] = useState<LearnedRoute[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const { toast } = useToast();

  // Fetch existing recommendations from DB
  const fetchRecommendations = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('driver_id', user.user.id)
        .eq('is_active', true)
        .gt('valid_until', new Date().toISOString())
        .order('priority', { ascending: false });

      if (error) throw error;
      
      setRecommendations((data || []) as AIRecommendation[]);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  }, []);

  // Fetch learned routes
  const fetchLearnedRoutes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('learned_routes')
        .select('*')
        .order('popularity_score', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setLearnedRoutes((data || []) as LearnedRoute[]);
    } catch (error) {
      console.error('Error fetching learned routes:', error);
    }
  }, []);

  // Predict traffic hotspots
  const predictTraffic = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-traffic-intelligence', {
        body: { action: 'predict_traffic' }
      });

      if (error) throw error;

      if (data?.data?.predictions) {
        setPredictions(data.data.predictions);
        setLastAnalysis(new Date());
        toast({
          title: "Analyse IA terminée",
          description: `${data.data.predictions.length} zones de forte demande identifiées`,
        });
      }

      return data?.data;
    } catch (error: any) {
      console.error('Error predicting traffic:', error);
      toast({
        title: "Erreur d'analyse",
        description: error.message || "Impossible d'analyser le trafic",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  // Get personalized recommendations for driver
  const getRecommendations = useCallback(async (driverLocation?: { lat: number; lng: number }) => {
    setIsAnalyzing(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('ai-traffic-intelligence', {
        body: { 
          action: 'recommend_zones',
          driverId: user.user?.id,
          driverLocation: driverLocation || { lat: 4.0511, lng: 9.7043 }
        }
      });

      if (error) throw error;

      if (data?.data?.recommendations) {
        await fetchRecommendations();
        toast({
          title: "Recommandations IA",
          description: data.data.best_action || "Nouvelles zones recommandées",
        });
      }

      return data?.data;
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'obtenir des recommandations",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast, fetchRecommendations]);

  // Learn new routes from trip data
  const learnRoutes = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-traffic-intelligence', {
        body: { action: 'learn_routes' }
      });

      if (error) throw error;

      if (data?.data) {
        await fetchLearnedRoutes();
        toast({
          title: "Apprentissage terminé",
          description: data.data.insights || "Nouvelles routes apprises",
        });
      }

      return data?.data;
    } catch (error: any) {
      console.error('Error learning routes:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'apprendre les routes",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast, fetchLearnedRoutes]);

  // Subscribe to realtime recommendation updates
  useEffect(() => {
    fetchRecommendations();
    fetchLearnedRoutes();

    const channel = supabase
      .channel('ai-recommendations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_recommendations',
        },
        () => {
          fetchRecommendations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecommendations, fetchLearnedRoutes]);

  return {
    // Data
    predictions,
    recommendations,
    learnedRoutes,
    isAnalyzing,
    lastAnalysis,
    
    // Actions
    predictTraffic,
    getRecommendations,
    learnRoutes,
    refetch: fetchRecommendations,
  };
};
