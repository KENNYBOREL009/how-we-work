import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFleetOwner } from '@/hooks/useFleetOwner';
import { useDriverAssignments } from '@/hooks/useDriverAssignments';
import { supabase } from '@/integrations/supabase/client';
import type { DriverOperatingMode, DriverProfile, DailyEarningsSummary } from '@/types/driver';
import { DRIVER_MODE_CONFIGS } from '@/types/driver';

export const useDriverOperatingMode = () => {
  const { user } = useAuth();
  const { isFleetOwner } = useFleetOwner();
  const { myAssignments } = useDriverAssignments();
  
  const [operatingMode, setOperatingMode] = useState<DriverOperatingMode | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState<DailyEarningsSummary | null>(null);

  // Détermine le mode de fonctionnement basé sur les données
  const detectOperatingMode = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Vérifie si le chauffeur est assigné à une flotte
      if (myAssignments && myAssignments.length > 0) {
        const activeAssignment = myAssignments[0];
        setOperatingMode('fleet_assigned');
        setDriverProfile({
          id: activeAssignment.id,
          userId: user.id,
          operatingMode: 'fleet_assigned',
          fleetVehicleId: activeAssignment.fleet_vehicle_id,
          assignmentId: activeAssignment.id,
          commissionRate: activeAssignment.commission_rate || 20,
          isActive: true,
        });
        return;
      }

      // Vérifie si l'utilisateur possède un véhicule
      const { data: ownedVehicles } = await supabase
        .from('vehicles')
        .select('id')
        .eq('driver_id', user.id)
        .eq('is_active', true);

      if (ownedVehicles && ownedVehicles.length > 0) {
        setOperatingMode('independent_owner');
        setDriverProfile({
          id: user.id,
          userId: user.id,
          operatingMode: 'independent_owner',
          vehicleId: ownedVehicles[0].id,
          isActive: true,
        });
        return;
      }

      // Par défaut: indépendant locataire
      setOperatingMode('independent_tenant');
      setDriverProfile({
        id: user.id,
        userId: user.id,
        operatingMode: 'independent_tenant',
        isActive: true,
      });
    } catch (error) {
      console.error('Error detecting operating mode:', error);
      // Fallback au mode indépendant locataire
      setOperatingMode('independent_tenant');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, myAssignments]);

  // Récupère le résumé quotidien des gains
  const fetchDailySummary = useCallback(async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: report } = await supabase
        .from('driver_daily_reports')
        .select('*')
        .eq('driver_id', user.id)
        .eq('report_date', today)
        .maybeSingle();

      if (report) {
        setDailySummary({
          date: report.report_date,
          grossEarnings: report.gross_earnings || 0,
          totalExpenses: report.total_expenses || 0,
          fuelCost: 0, // À calculer depuis les dépenses
          rentAmount: 0,
          commission: report.commission_amount || 0,
          netEarnings: report.net_earnings || 0,
          tripCount: report.total_trips || 0,
          distanceKm: Number(report.total_distance_km) || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error);
    }
  }, [user?.id]);

  // Définit manuellement le mode (pour les nouveaux chauffeurs)
  const setMode = useCallback((mode: DriverOperatingMode) => {
    setOperatingMode(mode);
    if (user?.id) {
      setDriverProfile(prev => ({
        ...prev,
        id: prev?.id || user.id,
        userId: user.id,
        operatingMode: mode,
        isActive: true,
      }));
    }
  }, [user?.id]);

  // Récupère la configuration du mode actuel
  const getModeConfig = useCallback(() => {
    if (!operatingMode) return null;
    return DRIVER_MODE_CONFIGS[operatingMode];
  }, [operatingMode]);

  useEffect(() => {
    detectOperatingMode();
  }, [detectOperatingMode]);

  useEffect(() => {
    if (operatingMode) {
      fetchDailySummary();
    }
  }, [operatingMode, fetchDailySummary]);

  return {
    operatingMode,
    driverProfile,
    dailySummary,
    isLoading,
    isFleetOwner,
    modeConfig: getModeConfig(),
    setMode,
    refreshSummary: fetchDailySummary,
    allModes: DRIVER_MODE_CONFIGS,
  };
};
