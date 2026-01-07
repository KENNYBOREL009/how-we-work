import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface FleetAssignmentDetails {
  assignmentId: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleType: string;
  fleetOwnerId: string;
  ownerName: string;
  ownerPhone: string | null;
  ownerCompany: string | null;
  commissionRate: number;
  shiftType: string | null;
  startDate: string;
  dailyTarget: number | null;
  isActive: boolean;
}

export const useFleetAssignment = () => {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<FleetAssignmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssignment = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch driver's active assignment with joined data
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('driver_assignments')
        .select(`
          id,
          commission_rate,
          shift_type,
          start_date,
          daily_target,
          is_active,
          fleet_vehicle_id,
          fleet_vehicles!inner (
            id,
            fleet_owner_id,
            vehicle_id,
            vehicles!inner (
              plate_number,
              vehicle_type
            )
          )
        `)
        .eq('driver_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (assignmentError && assignmentError.code !== 'PGRST116') {
        console.error('Error fetching assignment:', assignmentError);
        setIsLoading(false);
        return;
      }

      if (!assignmentData) {
        setAssignment(null);
        setIsLoading(false);
        return;
      }

      // Fetch fleet owner details
      const fleetVehicle = assignmentData.fleet_vehicles as any;
      const vehicle = fleetVehicle?.vehicles;

      const { data: ownerData, error: ownerError } = await supabase
        .from('fleet_owners')
        .select('company_name, contact_phone, user_id')
        .eq('id', fleetVehicle.fleet_owner_id)
        .single();

      let ownerName = 'Propriétaire';
      if (ownerData?.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', ownerData.user_id)
          .single();

        if (profileData) {
          ownerName = [profileData.first_name, profileData.last_name]
            .filter(Boolean)
            .join(' ') || 'Propriétaire';
        }
      }

      setAssignment({
        assignmentId: assignmentData.id,
        vehicleId: fleetVehicle.vehicle_id,
        vehiclePlate: vehicle?.plate_number || 'XX-XXX-XX',
        vehicleType: vehicle?.vehicle_type || 'taxi',
        fleetOwnerId: fleetVehicle.fleet_owner_id,
        ownerName: ownerData?.company_name || ownerName,
        ownerPhone: ownerData?.contact_phone || null,
        ownerCompany: ownerData?.company_name || null,
        commissionRate: assignmentData.commission_rate || 20,
        shiftType: assignmentData.shift_type,
        startDate: assignmentData.start_date,
        dailyTarget: assignmentData.daily_target,
        isActive: assignmentData.is_active,
      });
    } catch (error) {
      console.error('Error in useFleetAssignment:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  return {
    assignment,
    isLoading,
    refetch: fetchAssignment,
    hasFleetAssignment: !!assignment,
  };
};
