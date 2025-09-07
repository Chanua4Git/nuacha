import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BudgetSummary, IncomeSource, BudgetCategory, BudgetAllocation } from '@/types/budget';
import { Expense } from '@/types/expense';
import { toMonthly, getFirstDayOfMonth } from '@/utils/budgetUtils';
import { useAuth } from '@/auth/contexts/AuthProvider';

export function useBudgetSummary(startDate: Date, endDate?: Date, familyId?: string) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateKey = useMemo(() => `${startDate.toISOString()}-${endDate?.toISOString() || startDate.toISOString()}-${familyId || 'all'}`, [startDate, endDate, familyId]);

  const calculateSummary = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First check for active budget template income
      let templateIncome = 0;
      
      const { data: activeTemplate, error: templateError } = await supabase
        .from('budget_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_default', true)
        .or(familyId ? `family_id.eq.${familyId}` : 'family_id.is.null')
        .maybeSingle();

      if (templateError && templateError.code !== 'PGRST116') throw templateError;

      // Extract template expenses by group and unpaid labor
      let templateExpensesByGroup = { needs: 0, wants: 0, savings: 0 };
      let templateUnpaidLabor = 0;
      
      if (activeTemplate?.template_data) {
        // Calculate total income from template
        const templateData = activeTemplate.template_data as any;
        if (templateData?.income && typeof templateData.income === 'object') {
          const incomeValues = Object.values(templateData.income);
          templateIncome = incomeValues.reduce((sum: number, val: unknown) => sum + (Number(val) || 0), 0) as number;
        }
        
        // Extract template expenses from needs, wants, savings
        if (templateData?.needs && typeof templateData.needs === 'object') {
          const needsValues = Object.values(templateData.needs);
          templateExpensesByGroup.needs = needsValues.reduce((sum: number, val: unknown) => sum + (Number(val) || 0), 0) as number;
        }
        
        if (templateData?.wants && typeof templateData.wants === 'object') {
          const wantsValues = Object.values(templateData.wants);
          templateExpensesByGroup.wants = wantsValues.reduce((sum: number, val: unknown) => sum + (Number(val) || 0), 0) as number;
        }
        
        if (templateData?.savings && typeof templateData.savings === 'object') {
          const savingsValues = Object.values(templateData.savings);
          templateExpensesByGroup.savings = savingsValues.reduce((sum: number, val: unknown) => sum + (Number(val) || 0), 0) as number;
        }
        
        // Extract unpaid labor if included
        if (templateData?.includeUnpaidLabor && templateData?.unpaidLabor && typeof templateData.unpaidLabor === 'object') {
          const unpaidLaborValues = Object.values(templateData.unpaidLabor);
          templateUnpaidLabor = unpaidLaborValues.reduce((sum: number, val: unknown) => sum + (Number(val) || 0), 0) as number;
        }
      }

      // Fetch income sources as fallback - filter by family if provided
      let incomeQuery = supabase
        .from('income_sources')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (familyId) {
        incomeQuery = incomeQuery.eq('family_id', familyId);
      }
      
      const { data: incomeSources, error: incomeError } = await incomeQuery;

      if (incomeError) throw incomeError;

      // Fetch user's families first
      const { data: userFamilies, error: familiesError } = await supabase
        .from('families')
        .select('id')
        .eq('user_id', user.id);

      if (familiesError) throw familiesError;

      const familyIds = (userFamilies || []).map(f => f.id);

      // Fetch budget categories from unified categories table (both user-level and family-level)
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .is('is_budget_category', true)
        .or(`user_id.eq.${user.id},family_id.in.(${familyIds.join(',')})`);

      if (categoriesError) throw categoriesError;

      // Fetch expenses for the selected period, filtered by user's families
      const periodStart = startDate;
      const periodEnd = endDate || new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
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

      // Calculate total monthly income - prioritize template income over income sources
      const totalIncome = templateIncome > 0 
        ? templateIncome 
        : (incomeSources || []).reduce((sum, source) => {
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
        // Priority order: budget_category_id first, then category field, then name matching
        let category = null;
        
        // 1. Check budget_category_id first (preferred)
        if (expense.budget_category_id) {
          category = categories?.find(cat => cat.id === expense.budget_category_id);
        }
        
        // 2. If no budget category found, try category field as UUID
        if (!category && expense.category) {
          category = categories?.find(cat => cat.id === expense.category);
        }
        
        // 3. Fallback to name matching if category is a string
        if (!category && expense.category) {
          category = categories?.find(cat => cat.name === expense.category);
        }
        
        // 4. If still no budget category found, try to map to default "wants" category
        if (!category) {
          category = categories?.find(cat => cat.group_type === 'wants' && cat.name === 'Unplanned purchases');
        }
        
        // Add to appropriate group
        if (category && category.group_type) {
          expensesByGroup[category.group_type] += expense.amount;
        } else {
          // Default to 'wants' if no category found
          expensesByGroup.wants += expense.amount;
        }
      });

      // Combine template expenses with regular expenses
      expensesByGroup.needs += templateExpensesByGroup.needs;
      expensesByGroup.wants += templateExpensesByGroup.wants;
      expensesByGroup.savings += templateExpensesByGroup.savings;

      const totalExpenses = Object.values(expensesByGroup).reduce((sum, amount) => sum + amount, 0);
      const totalWithUnpaidLabor = totalExpenses + templateUnpaidLabor;

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
        totalExpenses: totalExpenses, // Cash expenses only - DO NOT include unpaid labor
        byGroup,
        surplus: totalIncome - totalExpenses, // Surplus based on cash flow only
        ruleComparison,
        unpaidLaborValue: templateUnpaidLabor
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
  }, [user, dateKey, familyId]);

  return { summary, loading, error, refetch: calculateSummary };
}