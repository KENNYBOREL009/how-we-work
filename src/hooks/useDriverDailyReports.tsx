import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { DriverDailyReport } from '@/types';

interface CreateReportData {
  report_date?: string;
  total_trips?: number;
  total_distance_km?: number;
  gross_earnings?: number;
  total_expenses?: number;
  notes?: string;
  fleet_vehicle_id?: string;
}

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  isValidated?: boolean;
}

export const useDriverDailyReports = (filters?: ReportFilters) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<DriverDailyReport[]>([]);
  const [todayReport, setTodayReport] = useState<DriverDailyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('driver_daily_reports')
        .select('*')
        .eq('driver_id', user.id)
        .order('report_date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('report_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('report_date', filters.endDate);
      }
      if (filters?.isValidated !== undefined) {
        query = query.eq('is_validated', filters.isValidated);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }

      setReports(data || []);

      // Find today's report
      const today = new Date().toISOString().split('T')[0];
      const todayRep = (data || []).find((r) => r.report_date === today);
      setTodayReport(todayRep || null);
    } catch (error) {
      console.error('Error in fetchReports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createOrUpdateReport = async (data: CreateReportData) => {
    if (!user?.id) return null;

    const reportDate = data.report_date || new Date().toISOString().split('T')[0];
    const netEarnings = (data.gross_earnings || 0) - (data.total_expenses || 0);
    const commissionRate = 0.20; // 20% default
    const commissionAmount = Math.round((data.gross_earnings || 0) * commissionRate);
    const driverShare = (data.gross_earnings || 0) - commissionAmount - (data.total_expenses || 0);
    const ownerShare = commissionAmount;

    try {
      // Try to upsert (insert or update if exists)
      const { data: report, error } = await supabase
        .from('driver_daily_reports')
        .upsert({
          driver_id: user.id,
          report_date: reportDate,
          total_trips: data.total_trips || 0,
          total_distance_km: data.total_distance_km || 0,
          gross_earnings: data.gross_earnings || 0,
          total_expenses: data.total_expenses || 0,
          net_earnings: netEarnings,
          commission_amount: commissionAmount,
          driver_share: driverShare,
          owner_share: ownerShare,
          notes: data.notes,
          fleet_vehicle_id: data.fleet_vehicle_id,
        }, {
          onConflict: 'driver_id,report_date',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating/updating report:', error);
        return null;
      }

      await fetchReports();
      return report;
    } catch (error) {
      console.error('Error in createOrUpdateReport:', error);
      return null;
    }
  };

  const updateReport = async (reportId: string, data: Partial<DriverDailyReport>) => {
    try {
      const { error } = await supabase
        .from('driver_daily_reports')
        .update({
          total_trips: data.total_trips,
          total_distance_km: data.total_distance_km,
          gross_earnings: data.gross_earnings,
          total_expenses: data.total_expenses,
          notes: data.notes,
        })
        .eq('id', reportId);

      if (error) {
        console.error('Error updating report:', error);
        return false;
      }

      await fetchReports();
      return true;
    } catch (error) {
      console.error('Error in updateReport:', error);
      return false;
    }
  };

  // Calculate summary statistics
  const getSummary = (period: 'week' | 'month' = 'week') => {
    const now = new Date();
    const startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const filteredReports = reports.filter((r) => new Date(r.report_date) >= startDate);

    return {
      totalTrips: filteredReports.reduce((sum, r) => sum + r.total_trips, 0),
      totalDistance: filteredReports.reduce((sum, r) => sum + r.total_distance_km, 0),
      grossEarnings: filteredReports.reduce((sum, r) => sum + r.gross_earnings, 0),
      totalExpenses: filteredReports.reduce((sum, r) => sum + r.total_expenses, 0),
      netEarnings: filteredReports.reduce((sum, r) => sum + r.net_earnings, 0),
      driverShare: filteredReports.reduce((sum, r) => sum + r.driver_share, 0),
      ownerShare: filteredReports.reduce((sum, r) => sum + r.owner_share, 0),
      daysWorked: filteredReports.length,
      avgDailyEarnings: filteredReports.length > 0 
        ? Math.round(filteredReports.reduce((sum, r) => sum + r.net_earnings, 0) / filteredReports.length)
        : 0,
    };
  };

  useEffect(() => {
    fetchReports();
  }, [user?.id, filters?.startDate, filters?.endDate, filters?.isValidated]);

  return {
    reports,
    todayReport,
    isLoading,
    createOrUpdateReport,
    updateReport,
    getSummary,
    refetch: fetchReports,
  };
};
