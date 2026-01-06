import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface TransportBudget {
  id: string;
  user_id: string;
  name: string;
  daily_cost: number;
  working_days: number;
  total_amount: number;
  locked_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetInput {
  name: string;
  daily_cost: number;
  working_days: number;
}

export const useTransportBudget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<TransportBudget[]>([]);
  const [activeBudget, setActiveBudget] = useState<TransportBudget | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transport_budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as TransportBudget[];
      setBudgets(typedData);
      setActiveBudget(typedData.find(b => b.is_active) || null);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBudget = async (input: CreateBudgetInput): Promise<boolean> => {
    if (!user) return false;

    const total_amount = input.daily_cost * input.working_days;
    const start_date = new Date();
    const end_date = new Date();
    end_date.setDate(end_date.getDate() + 30);

    try {
      // Désactiver les anciens budgets
      await supabase
        .from('transport_budgets')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      const { error } = await supabase
        .from('transport_budgets')
        .insert({
          user_id: user.id,
          name: input.name,
          daily_cost: input.daily_cost,
          working_days: input.working_days,
          total_amount,
          locked_amount: total_amount,
          start_date: start_date.toISOString().split('T')[0],
          end_date: end_date.toISOString().split('T')[0],
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Budget créé",
        description: `${total_amount.toLocaleString()} FCFA verrouillés pour ${input.working_days} jours`,
      });

      await fetchBudgets();
      return true;
    } catch (error) {
      console.error('Error creating budget:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le budget",
        variant: "destructive",
      });
      return false;
    }
  };

  const deactivateBudget = async (budgetId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('transport_budgets')
        .update({ is_active: false })
        .eq('id', budgetId);

      if (error) throw error;

      toast({
        title: "Budget désactivé",
        description: "Votre budget a été libéré",
      });

      await fetchBudgets();
      return true;
    } catch (error) {
      console.error('Error deactivating budget:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [user]);

  return {
    budgets,
    activeBudget,
    loading,
    createBudget,
    deactivateBudget,
    refetch: fetchBudgets,
  };
};
