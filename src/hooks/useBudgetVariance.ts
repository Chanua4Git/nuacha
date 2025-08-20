import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import type { BudgetVarianceData, BudgetComparison } from '@/types/budgetTemplate';
import { useBudgetTemplates } from './useBudgetTemplates';
import { toMonthly } from '@/utils/budgetUtils';
import { toast } from 'sonner';

export function useBudgetVariance(startDate: Date, endDate?: Date) {
  const { user } = useAuth();
  const { getDefaultTemplate } = useBudgetTemplates();
  const [variance, setVariance] = useState<BudgetVarianceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      calculateVariance();
    }
  }, [user, startDate, endDate]);

  const calculateVariance = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const template = getDefaultTemplate();
      if (!template) {
        setVariance(null);
        return;
      }

      // Get actual data for the period
      const endDateValue = endDate || new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      // Fetch actual income sources
      const { data: incomeSources, error: incomeError } = await supabase
        .from('income_sources')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true);

      if (incomeError) throw incomeError;

      // Fetch actual expenses
      const { data: families, error: familiesError } = await supabase
        .from('families')
        .select(`
          id,
          name,
          expenses!inner(
            id,
            amount,
            budget_category_id,
            date
          )
        `)
        .eq('user_id', user!.id);

      if (familiesError) throw familiesError;

      // Fetch budget categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_budget_category', true)
        .is('family_id', null);

      if (categoriesError) throw categoriesError;

      // Calculate actual totals
      const actualIncome = (incomeSources || []).reduce((sum, source) => 
        sum + toMonthly(source.amount_ttd, source.frequency as any), 0
      );

      const expenses = families?.flatMap(family => family.expenses || []) || [];
      const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDateValue;
      });

      // Group expenses by budget category
      const expensesByCategory: Record<string, number> = {};
      const expensesByGroup = { needs: 0, wants: 0, savings: 0 };

      filteredExpenses.forEach(expense => {
        if (expense.budget_category_id) {
          expensesByCategory[expense.budget_category_id] = 
            (expensesByCategory[expense.budget_category_id] || 0) + Number(expense.amount);
          
          // Find category to determine group
          const category = categories?.find(cat => cat.id === expense.budget_category_id);
          if (category?.group_type && category.group_type in expensesByGroup) {
            expensesByGroup[category.group_type as keyof typeof expensesByGroup] += Number(expense.amount);
          }
        }
      });

      const totalActualExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);

      // Get planned amounts from template
      const templateData = template.template_data;
      const plannedIncome = template.total_monthly_income;
      
      const plannedNeeds = Object.values(templateData.needs || {}).reduce((sum, amount) => sum + Number(amount), 0);
      const plannedWants = Object.values(templateData.wants || {}).reduce((sum, amount) => sum + Number(amount), 0);
      const plannedSavings = Object.values(templateData.savings || {}).reduce((sum, amount) => sum + Number(amount), 0);
      const totalPlannedExpenses = plannedNeeds + plannedWants + plannedSavings;

      // Create comparison function
      const createComparison = (planned: number, actual: number): BudgetComparison => ({
        planned,
        actual,
        variance: actual - planned,
        percentageUsed: planned > 0 ? (actual / planned) * 100 : 0,
      });

      // Build variance data
      const varianceData: BudgetVarianceData = {
        totalIncome: createComparison(plannedIncome, actualIncome),
        byGroup: {
          needs: createComparison(plannedNeeds, expensesByGroup.needs),
          wants: createComparison(plannedWants, expensesByGroup.wants),
          savings: createComparison(plannedSavings, expensesByGroup.savings),
        },
        byCategory: {},
        overallSurplus: createComparison(
          plannedIncome - totalPlannedExpenses,
          actualIncome - totalActualExpenses
        ),
      };

      // Add category-level comparisons
      categories?.forEach(category => {
        const categoryKey = category.name.toLowerCase().replace(/\s+/g, '_');
        const plannedAmount = (templateData[category.group_type as keyof typeof templateData] as Record<string, number>)?.[categoryKey] || 0;
        const actualAmount = expensesByCategory[category.id] || 0;
        
        if (plannedAmount > 0 || actualAmount > 0) {
          varianceData.byCategory[category.id] = createComparison(plannedAmount, actualAmount);
        }
      });

      setVariance(varianceData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate budget variance';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    variance,
    isLoading,
    error,
    refetch: calculateVariance,
  };
}