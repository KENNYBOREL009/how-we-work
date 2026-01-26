import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useWallet } from './useWallet';
import { useToast } from './use-toast';

// Re-export types from centralized types
import type { Trip, SharedRidePassenger } from '@/types';
export type { Trip, SharedRidePassenger };

export const useActiveTrip = () => {
  const { user } = useAuth();
  const { wallet, refetch: refetchWallet } = useWallet();
  const { toast } = useToast();
  
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [coPassengers, setCoPassengers] = useState<SharedRidePassenger[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveTrip = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .in('current_status', ['searching', 'driver_assigned', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setActiveTrip(data as unknown as Trip);
        
        // Si course partagée, récupérer les co-passagers
        if (data.is_shared_ride) {
          await fetchCoPassengers(data.id);
        }
      } else {
        setActiveTrip(null);
      }
    } catch (error) {
      console.error('Error fetching active trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoPassengers = async (tripId: string) => {
    try {
      const { data, error } = await supabase
        .from('shared_ride_passengers')
        .select('*')
        .eq('trip_id', tripId)
        .eq('status', 'active');

      if (error) throw error;
      setCoPassengers((data || []) as SharedRidePassenger[]);
    } catch (error) {
      console.error('Error fetching co-passengers:', error);
    }
  };

  const createTrip = async (tripData: Partial<Trip>): Promise<Trip | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          trip_type: tripData.trip_type || 'taxi',
          origin: tripData.origin,
          destination: tripData.destination,
          fare: tripData.fare,
          vehicle_id: tripData.vehicle_id,
          is_shared_ride: tripData.is_shared_ride || false,
          pickup_location: tripData.pickup_location,
          pickup_lat: tripData.pickup_lat,
          pickup_lng: tripData.pickup_lng,
          current_status: 'searching',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      
      const trip = data as unknown as Trip;
      setActiveTrip(trip);
      return trip;
    } catch (error) {
      console.error('Error creating trip:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la course",
        variant: "destructive",
      });
      return null;
    }
  };

  const confirmPayment = async (tripId: string, amount: number): Promise<boolean> => {
    if (!user || !wallet) return false;

    if (wallet.balance < amount) {
      toast({
        title: "Solde insuffisant",
        description: "Rechargez votre wallet pour continuer",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Déduire du wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: wallet.balance - amount })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      // Créer la transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          amount: amount,
          type: 'debit',
          description: `Course - ${activeTrip?.destination || 'Transport'}`,
        });

      // Mettre à jour le statut de paiement
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          payment_status: 'paid',
          payment_confirmed_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      if (tripError) throw tripError;

      await refetchWallet();
      
      toast({
        title: "Paiement confirmé",
        description: `${amount.toLocaleString()} FCFA débités de votre wallet`,
      });

      return true;
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
      return false;
    }
  };

  const rateDriver = async (
    tripId: string, 
    driverId: string, 
    rating: number, 
    comment: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Ajouter la note
      const { error: ratingError } = await supabase
        .from('driver_ratings')
        .insert({
          driver_id: driverId,
          user_id: user.id,
          trip_id: tripId,
          rating,
          comment,
        });

      if (ratingError) throw ratingError;

      // Mettre à jour le trip
      await supabase
        .from('trips')
        .update({
          driver_rating: rating,
          driver_comment: comment,
        })
        .eq('id', tripId);

      toast({
        title: "Merci !",
        description: "Votre avis a été enregistré",
      });

      return true;
    } catch (error) {
      console.error('Error rating driver:', error);
      return false;
    }
  };

  const cancelTrip = async (tripId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          current_status: 'cancelled',
          status: 'cancelled',
        })
        .eq('id', tripId);

      if (error) throw error;

      setActiveTrip(null);
      toast({
        title: "Course annulée",
        description: "Votre course a été annulée",
      });

      return true;
    } catch (error) {
      console.error('Error cancelling trip:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchActiveTrip();

    // S'abonner aux changements en temps réel
    if (user) {
      const channel = supabase
        .channel('active-trip-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trips',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchActiveTrip();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    activeTrip,
    coPassengers,
    loading,
    createTrip,
    confirmPayment,
    rateDriver,
    cancelTrip,
    refetch: fetchActiveTrip,
  };
};
