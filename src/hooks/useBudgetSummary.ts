import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BudgetSummary, IncomeSource, BudgetCategory, BudgetAllocation } from '@/types/budget';
import { Expense } from '@/types/expense';
import { toMonthly, getFirstDayOfMonth } from '@/utils/budgetUtils';
import { useAuth } from '@/auth/contexts/AuthProvider';

export function useBudgetSummary(startDate: Date, endDate?: Date) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateKey = useMemo(() => `${startDate.toISOString()}-${endDate?.toISOString() || startDate.toISOString()}`, [startDate, endDate]);

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

      // Fetch budget categories from unified categories table
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .is('is_budget_category', true);

      if (categoriesError) throw categoriesError;

      // Fetch user's families first
      const { data: userFamilies, error: familiesError } = await supabase
        .from('families')
        .select('id')
        .eq('user_id', user.id);

      if (familiesError) throw familiesError;

      // Fetch expenses for the selected period, filtered by user's families
      const periodStart = startDate;
      const periodEnd = endDate || new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      const familyIds = (userFamilies || []).map(f => f.id);
      
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .in('family_id', familyIds)
        .gte('date', periodStart.toISOString().split('T')[0])
        .lte('date', periodEnd.toISOString().split('T')[0]);

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
        // Find category by name matching since expenses use category names
        const category = categories?.find(cat => cat.name === expense.category);
        if (category && category.group_type) {
          expensesByGroup[category.group_type] += expense.amount;
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
  }, [user, dateKey]);

  return { summary, loading, error, refetch: calculateSummary };
}