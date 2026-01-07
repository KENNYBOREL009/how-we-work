import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { DriverExpense, ExpenseType } from '@/types';

interface CreateExpenseData {
  expense_type: ExpenseType;
  amount: number;
  description?: string;
  receipt_url?: string;
  expense_date?: string;
  fleet_vehicle_id?: string;
}

interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  expenseType?: ExpenseType;
  isReimbursed?: boolean;
}

export const useDriverExpenses = (filters?: ExpenseFilters) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<DriverExpense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpenses = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('driver_expenses')
        .select('*')
        .eq('driver_id', user.id)
        .order('expense_date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('expense_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('expense_date', filters.endDate);
      }
      if (filters?.expenseType) {
        query = query.eq('expense_type', filters.expenseType);
      }
      if (filters?.isReimbursed !== undefined) {
        query = query.eq('is_reimbursed', filters.isReimbursed);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching expenses:', error);
        return;
      }

      setExpenses((data || []) as DriverExpense[]);
      setTotalExpenses((data || []).reduce((sum, exp) => sum + exp.amount, 0));
    } catch (error) {
      console.error('Error in fetchExpenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createExpense = async (data: CreateExpenseData) => {
    if (!user?.id) return null;

    try {
      const { data: newExpense, error } = await supabase
        .from('driver_expenses')
        .insert({
          driver_id: user.id,
          expense_type: data.expense_type,
          amount: data.amount,
          description: data.description,
          receipt_url: data.receipt_url,
          expense_date: data.expense_date || new Date().toISOString().split('T')[0],
          fleet_vehicle_id: data.fleet_vehicle_id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating expense:', error);
        return null;
      }

      await fetchExpenses();
      return newExpense;
    } catch (error) {
      console.error('Error in createExpense:', error);
      return null;
    }
  };

  const updateExpense = async (expenseId: string, data: Partial<DriverExpense>) => {
    try {
      const { error } = await supabase
        .from('driver_expenses')
        .update({
          expense_type: data.expense_type,
          amount: data.amount,
          description: data.description,
          receipt_url: data.receipt_url,
          expense_date: data.expense_date,
        })
        .eq('id', expenseId);

      if (error) {
        console.error('Error updating expense:', error);
        return false;
      }

      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error in updateExpense:', error);
      return false;
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('driver_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.error('Error deleting expense:', error);
        return false;
      }

      await fetchExpenses();
      return true;
    } catch (error) {
      console.error('Error in deleteExpense:', error);
      return false;
    }
  };

  // Expense summary by type
  const getExpensesByType = () => {
    const byType: Record<ExpenseType, number> = {
      fuel: 0,
      maintenance: 0,
      insurance: 0,
      fine: 0,
      wash: 0,
      toll: 0,
      parking: 0,
      other: 0,
    };

    expenses.forEach((exp) => {
      byType[exp.expense_type] += exp.amount;
    });

    return byType;
  };

  useEffect(() => {
    fetchExpenses();
  }, [user?.id, filters?.startDate, filters?.endDate, filters?.expenseType, filters?.isReimbursed]);

  return {
    expenses,
    totalExpenses,
    isLoading,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpensesByType,
    refetch: fetchExpenses,
  };
};
