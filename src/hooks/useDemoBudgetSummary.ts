import { useDemoBudgetContext } from '@/context/DemoBudgetContext';

export function useDemoBudgetSummary() {
  const { budgetSummary, loading } = useDemoBudgetContext();
  
  return {
    summary: budgetSummary,
    loading,
    error: null,
    refetch: () => Promise.resolve()
  };
}