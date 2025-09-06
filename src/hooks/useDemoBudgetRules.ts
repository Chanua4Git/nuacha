import { useDemoBudgetContext } from '@/context/DemoBudgetContext';

export function useDemoBudgetRules() {
  const { budgetRules, loading, createRule, updateRule, deleteRule } = useDemoBudgetContext();
  
  const activeRule = budgetRules.find(rule => rule.is_default) || budgetRules[0];
  
  return {
    rules: budgetRules,
    activeRule,
    loading,
    createRule,
    updateRule,
    deleteRule,
    refetch: () => Promise.resolve()
  };
}