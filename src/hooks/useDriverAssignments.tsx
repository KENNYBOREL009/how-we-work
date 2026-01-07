import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { DriverAssignment, AssignmentType, ShiftType } from '@/types';

interface CreateAssignmentData {
  fleet_vehicle_id: string;
  driver_id: string;
  assignment_type?: AssignmentType;
  shift_type?: ShiftType;
  start_date?: string;
  end_date?: string;
  daily_target?: number;
  commission_rate?: number;
}

export const useDriverAssignments = (fleetVehicleId?: string) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<DriverAssignment[]>([]);
  const [myAssignments, setMyAssignments] = useState<DriverAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch assignments for a fleet vehicle (fleet owner view)
  const fetchVehicleAssignments = async () => {
    if (!fleetVehicleId) return;

    try {
      const { data, error } = await supabase
        .from('driver_assignments')
        .select('*')
        .eq('fleet_vehicle_id', fleetVehicleId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicle assignments:', error);
        return;
      }

      setAssignments((data || []) as DriverAssignment[]);
    } catch (error) {
      console.error('Error in fetchVehicleAssignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch driver's own assignments
  const fetchMyAssignments = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('driver_assignments')
        .select(`
          *,
          fleet_vehicles (
            *,
            vehicles (*)
          )
        `)
        .eq('driver_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my assignments:', error);
        return;
      }

      setMyAssignments((data || []) as DriverAssignment[]);
    } catch (error) {
      console.error('Error in fetchMyAssignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAssignment = async (data: CreateAssignmentData) => {
    try {
      const { data: newAssignment, error } = await supabase
        .from('driver_assignments')
        .insert({
          fleet_vehicle_id: data.fleet_vehicle_id,
          driver_id: data.driver_id,
          assignment_type: data.assignment_type || 'permanent',
          shift_type: data.shift_type,
          start_date: data.start_date || new Date().toISOString().split('T')[0],
          end_date: data.end_date,
          daily_target: data.daily_target,
          commission_rate: data.commission_rate || 20.00,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating assignment:', error);
        return null;
      }

      await fetchVehicleAssignments();
      return newAssignment;
    } catch (error) {
      console.error('Error in createAssignment:', error);
      return null;
    }
  };

  const updateAssignment = async (assignmentId: string, data: Partial<DriverAssignment>) => {
    try {
      const { error } = await supabase
        .from('driver_assignments')
        .update({
          assignment_type: data.assignment_type,
          shift_type: data.shift_type,
          end_date: data.end_date,
          daily_target: data.daily_target,
          commission_rate: data.commission_rate,
          is_active: data.is_active,
        })
        .eq('id', assignmentId);

      if (error) {
        console.error('Error updating assignment:', error);
        return false;
      }

      await fetchVehicleAssignments();
      return true;
    } catch (error) {
      console.error('Error in updateAssignment:', error);
      return false;
    }
  };

  const endAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('driver_assignments')
        .update({
          is_active: false,
          end_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', assignmentId);

      if (error) {
        console.error('Error ending assignment:', error);
        return false;
      }

      await fetchVehicleAssignments();
      return true;
    } catch (error) {
      console.error('Error in endAssignment:', error);
      return false;
    }
  };

  useEffect(() => {
    if (fleetVehicleId) {
      fetchVehicleAssignments();
    } else {
      fetchMyAssignments();
    }
  }, [fleetVehicleId, user?.id]);

  return {
    assignments,
    myAssignments,
    isLoading,
    createAssignment,
    updateAssignment,
    endAssignment,
    refetchVehicle: fetchVehicleAssignments,
    refetchMine: fetchMyAssignments,
  };
};
