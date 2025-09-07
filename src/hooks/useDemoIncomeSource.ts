import { useDemoBudgetContext } from '@/context/DemoBudgetContext';

export function useDemoIncomeSource() {
  const { incomeSources, loading, createIncomeSource, updateIncomeSource, deleteIncomeSource } = useDemoBudgetContext();
  
  return {
    incomeSources,
    loading,
    createIncomeSource,
    updateIncomeSource,
    deleteIncomeSource
  };
}