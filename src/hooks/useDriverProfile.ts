import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type EmploymentType = 'owner' | 'employee';
export type PaymentModel = 'daily_rental' | 'commission' | null;

export interface DriverProfile {
  employmentType: EmploymentType;
  paymentModel: PaymentModel;
  dailyRentalAmount: number;
  commissionRate: number;
  assignedVehiclePlate: string | null;
  fleetOwnerName: string | null;
  fleetOwnerPhone: string | null;
  isConfigured: boolean;
  fleetVehicleId: string | null;
}

const DEFAULT_PROFILE: DriverProfile = {
  employmentType: 'owner',
  paymentModel: null,
  dailyRentalAmount: 0,
  commissionRate: 0,
  assignedVehiclePlate: null,
  fleetOwnerName: null,
  fleetOwnerPhone: null,
  isConfigured: false,
  fleetVehicleId: null,
};

export const useDriverProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      
      // Check if driver has an active assignment (employee)
      const { data: assignment } = await supabase
        .from('driver_assignments')
        .select(`
          *,
          fleet_vehicles (
            id,
            fleet_owner_id,
            vehicle_id,
            vehicles (plate_number),
            fleet_owners (company_name, contact_phone)
          )
        `)
        .eq('driver_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (assignment) {
        // Driver is an employee
        const fleetVehicle = assignment.fleet_vehicles as any;
        const vehicle = fleetVehicle?.vehicles;
        const owner = fleetVehicle?.fleet_owners;
        
        setProfile({
          employmentType: 'employee',
          paymentModel: assignment.daily_target ? 'daily_rental' : 'commission',
          dailyRentalAmount: assignment.daily_target || 0,
          commissionRate: assignment.commission_rate || 20,
          assignedVehiclePlate: vehicle?.plate_number || null,
          fleetOwnerName: owner?.company_name || null,
          fleetOwnerPhone: owner?.contact_phone || null,
          isConfigured: true,
          fleetVehicleId: fleetVehicle?.id || null,
        });
      } else {
        // Check if user owns a vehicle
        const { data: vehicle } = await supabase
          .from('vehicles')
          .select('*')
          .eq('driver_id', user.id)
          .maybeSingle();

        if (vehicle) {
          setProfile({
            ...DEFAULT_PROFILE,
            employmentType: 'owner',
            assignedVehiclePlate: vehicle.plate_number,
            isConfigured: true,
          });
        } else {
          // New driver, not configured yet
          setProfile(DEFAULT_PROFILE);
        }
      }
      
      setIsLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updateProfile = (updates: Partial<DriverProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const saveProfile = async () => {
    if (!user) return false;
    
    // For now, just mark as configured locally
    // In production, this would save to a driver_profiles table
    setProfile(prev => ({ ...prev, isConfigured: true }));
    return true;
  };

  return { 
    profile, 
    updateProfile, 
    saveProfile,
    isLoading,
    isConfigured: profile.isConfigured,
  };
};
