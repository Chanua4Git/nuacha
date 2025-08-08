import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BudgetSummary, IncomeSource, BudgetCategory, BudgetAllocation } from '@/types/budget';
import { Expense } from '@/types/expense';
import { toMonthly, getFirstDayOfMonth } from '@/utils/budgetUtils';
import { useAuth } from '@/auth/contexts/AuthProvider';

export function useBudgetSummary(selectedMonth: Date) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthKey = useMemo(() => getFirstDayOfMonth(selectedMonth), [selectedMonth]);

  const calculateSummary = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch income sources
      const { data: incomeSources, error: incomeError } = await supabase
        .from('income_sources')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (incomeError) throw incomeError;

      // Fetch budget categories
      const { data: categories, error: categoriesError } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      // Fetch expenses for the selected month
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);

      if (expensesError) throw expensesError;

      // Fetch active budget allocation rule
      const { data: allocations, error: allocationsError } = await supabase
        .from('budget_allocations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (allocationsError && allocationsError.code !== 'PGRST116') throw allocationsError;

      // Use default rule if none found
      const rule = allocations || {
        needs_pct: 50,
        wants_pct: 30,
        savings_pct: 20
      };

      // Calculate total monthly income
      const totalIncome = (incomeSources || []).reduce((sum, source) => {
        return sum + toMonthly(source.amount_ttd, source.frequency as any);
      }, 0);

      // Create category lookup
      const categoryMap = new Map(
        (categories || []).map(cat => [cat.id, cat])
      );

      // Calculate expenses by group
      const expensesByGroup = {
        needs: 0,
        wants: 0,
        savings: 0
      };

      (expenses || []).forEach(expense => {
        if (expense.budget_category_id) {
          const category = categoryMap.get(expense.budget_category_id);
          if (category) {
            expensesByGroup[category.group_type] += expense.amount;
          }
        }
      });

      const totalExpenses = Object.values(expensesByGroup).reduce((sum, amount) => sum + amount, 0);

      // Calculate percentages and variances
      const byGroup = {
        needs: {
          total: expensesByGroup.needs,
          percentage: totalIncome > 0 ? (expensesByGroup.needs / totalIncome) * 100 : 0
        },
        wants: {
          total: expensesByGroup.wants,
          percentage: totalIncome > 0 ? (expensesByGroup.wants / totalIncome) * 100 : 0
        },
        savings: {
          total: expensesByGroup.savings,
          percentage: totalIncome > 0 ? (expensesByGroup.savings / totalIncome) * 100 : 0
        }
      };

      const ruleComparison = {
        needs: {
          actual: byGroup.needs.percentage,
          target: rule.needs_pct,
          variance: byGroup.needs.percentage - rule.needs_pct
        },
        wants: {
          actual: byGroup.wants.percentage,
          target: rule.wants_pct,
          variance: byGroup.wants.percentage - rule.wants_pct
        },
        savings: {
          actual: byGroup.savings.percentage,
          target: rule.savings_pct,
          variance: byGroup.savings.percentage - rule.savings_pct
        }
      };

      setSummary({
        totalIncome,
        totalExpenses,
        byGroup,
        surplus: totalIncome - totalExpenses,
        ruleComparison
      });

    } catch (err) {
      console.error('Error calculating budget summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate budget summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateSummary();
  }, [user, monthKey]);

  return { summary, loading, error, refetch: calculateSummary };
}