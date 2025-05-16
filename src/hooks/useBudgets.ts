
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Budget, BudgetWithCategory, BudgetFormData } from '@/types/accounting';
import { toast } from 'sonner';

export const useBudgets = (familyId?: string, month?: string, year?: number) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetsWithCategories, setBudgetsWithCategories] = useState<BudgetWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBudgets = async () => {
      if (!familyId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let query = supabase
          .from('budgets')
          .select(`
            *,
            categories (*)
          `)
          .eq('family_id', familyId);
        
        if (month) {
          query = query.eq('month', month);
        }
        
        if (year) {
          query = query.eq('year', year);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setBudgets(data.map(item => ({
          id: item.id,
          family_id: item.family_id,
          category_id: item.category_id,
          month: item.month,
          year: item.year,
          amount: item.amount,
          created_at: item.created_at
        })));
        
        setBudgetsWithCategories(data.map(item => ({
          ...item,
          category: item.categories
        })));
      } catch (err: any) {
        console.error('Error fetching budgets:', err);
        setError(err);
        toast("We had trouble loading your budgets", {
          description: "Please try refreshing the page."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgets();
  }, [familyId, month, year]);

  const createBudget = async (budgetData: BudgetFormData) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([budgetData])
        .select();
      
      if (error) throw error;
      
      setBudgets(prev => [...prev, data[0] as Budget]);
      
      toast("Budget created", {
        description: "Your new budget has been set."
      });
      
      return data[0];
    } catch (err: any) {
      console.error('Error creating budget:', err);
      toast("We couldn't create your budget", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      setBudgets(prev => 
        prev.map(budget => budget.id === id ? { ...budget, ...updates } : budget)
      );
      
      toast("Budget updated", {
        description: "Your budget changes have been saved."
      });
      
      return data[0];
    } catch (err: any) {
      console.error('Error updating budget:', err);
      toast("We couldn't update your budget", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setBudgets(prev => prev.filter(budget => budget.id !== id));
      
      toast("Budget removed", {
        description: "The budget entry has been deleted."
      });
    } catch (err: any) {
      console.error('Error deleting budget:', err);
      toast("We couldn't delete your budget", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  return {
    budgets,
    budgetsWithCategories,
    isLoading,
    error,
    createBudget,
    updateBudget,
    deleteBudget
  };
};
