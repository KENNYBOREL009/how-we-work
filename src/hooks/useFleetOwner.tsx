import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { FleetOwner } from '@/types';

export const useFleetOwner = () => {
  const { user } = useAuth();
  const [fleetOwner, setFleetOwner] = useState<FleetOwner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFleetOwner, setIsFleetOwner] = useState(false);

  const fetchFleetOwner = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fleet_owners')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching fleet owner:', error);
        return;
      }

      setFleetOwner(data);
      setIsFleetOwner(!!data);
    } catch (error) {
      console.error('Error in fetchFleetOwner:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createFleetOwner = async (data: Partial<FleetOwner>) => {
    if (!user?.id) return null;

    try {
      const { data: newOwner, error } = await supabase
        .from('fleet_owners')
        .insert({
          user_id: user.id,
          company_name: data.company_name,
          business_registration: data.business_registration,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
          address: data.address,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating fleet owner:', error);
        return null;
      }

      setFleetOwner(newOwner);
      setIsFleetOwner(true);
      return newOwner;
    } catch (error) {
      console.error('Error in createFleetOwner:', error);
      return null;
    }
  };

  const updateFleetOwner = async (data: Partial<FleetOwner>) => {
    if (!fleetOwner?.id) return false;

    try {
      const { error } = await supabase
        .from('fleet_owners')
        .update({
          company_name: data.company_name,
          business_registration: data.business_registration,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
          address: data.address,
        })
        .eq('id', fleetOwner.id);

      if (error) {
        console.error('Error updating fleet owner:', error);
        return false;
      }

      await fetchFleetOwner();
      return true;
    } catch (error) {
      console.error('Error in updateFleetOwner:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchFleetOwner();
  }, [user?.id]);

  return {
    fleetOwner,
    isFleetOwner,
    isLoading,
    createFleetOwner,
    updateFleetOwner,
    refetch: fetchFleetOwner,
  };
};
