import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFleetOwner } from './useFleetOwner';
import type { FleetVehicle, Vehicle } from '@/types';

interface FleetVehicleWithDetails extends FleetVehicle {
  vehicle: Vehicle;
}

export const useFleetVehicles = () => {
  const { fleetOwner, isFleetOwner } = useFleetOwner();
  const [vehicles, setVehicles] = useState<FleetVehicleWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFleetVehicles = async () => {
    if (!fleetOwner?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select(`
          *,
          vehicles (*)
        `)
        .eq('fleet_owner_id', fleetOwner.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching fleet vehicles:', error);
        return;
      }

      const formattedVehicles: FleetVehicleWithDetails[] = (data || []).map((fv: any) => ({
        ...fv,
        vehicle: {
          id: fv.vehicles?.id,
          vehicle_type: fv.vehicles?.vehicle_type,
          plate_number: fv.vehicles?.plate_number,
          capacity: fv.vehicles?.capacity || 4,
          destination: fv.vehicles?.destination,
          status: fv.vehicles?.status,
          operator: fv.vehicles?.operator,
          ride_mode: fv.vehicles?.ride_mode,
          current_passengers: fv.vehicles?.current_passengers || 0,
        } as Vehicle,
      }));

      setVehicles(formattedVehicles);
    } catch (error) {
      console.error('Error in fetchFleetVehicles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addVehicleToFleet = async (vehicleId: string, data?: Partial<FleetVehicle>) => {
    if (!fleetOwner?.id) return null;

    try {
      const { data: newFleetVehicle, error } = await supabase
        .from('fleet_vehicles')
        .insert({
          fleet_owner_id: fleetOwner.id,
          vehicle_id: vehicleId,
          purchase_date: data?.purchase_date,
          purchase_price: data?.purchase_price,
          insurance_expiry: data?.insurance_expiry,
          technical_control_expiry: data?.technical_control_expiry,
          notes: data?.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding vehicle to fleet:', error);
        return null;
      }

      await fetchFleetVehicles();
      return newFleetVehicle;
    } catch (error) {
      console.error('Error in addVehicleToFleet:', error);
      return null;
    }
  };

  const updateFleetVehicle = async (fleetVehicleId: string, data: Partial<FleetVehicle>) => {
    try {
      const { error } = await supabase
        .from('fleet_vehicles')
        .update({
          purchase_date: data.purchase_date,
          purchase_price: data.purchase_price,
          insurance_expiry: data.insurance_expiry,
          technical_control_expiry: data.technical_control_expiry,
          notes: data.notes,
          is_active: data.is_active,
        })
        .eq('id', fleetVehicleId);

      if (error) {
        console.error('Error updating fleet vehicle:', error);
        return false;
      }

      await fetchFleetVehicles();
      return true;
    } catch (error) {
      console.error('Error in updateFleetVehicle:', error);
      return false;
    }
  };

  const removeVehicleFromFleet = async (fleetVehicleId: string) => {
    try {
      const { error } = await supabase
        .from('fleet_vehicles')
        .delete()
        .eq('id', fleetVehicleId);

      if (error) {
        console.error('Error removing vehicle from fleet:', error);
        return false;
      }

      await fetchFleetVehicles();
      return true;
    } catch (error) {
      console.error('Error in removeVehicleFromFleet:', error);
      return false;
    }
  };

  useEffect(() => {
    if (isFleetOwner && fleetOwner?.id) {
      fetchFleetVehicles();
    }
  }, [fleetOwner?.id, isFleetOwner]);

  return {
    vehicles,
    isLoading,
    addVehicleToFleet,
    updateFleetVehicle,
    removeVehicleFromFleet,
    refetch: fetchFleetVehicles,
  };
};
