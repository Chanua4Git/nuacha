import { useDemoBudgetContext } from '@/context/DemoBudgetContext';

export function useDemoBudgetTemplates() {
  const { templates, isLoading, getDefaultTemplate } = useDemoBudgetContext();
  
  return {
    templates,
    isLoading,
    getDefaultTemplate,
    createTemplate: () => Promise.resolve(null),
    updateTemplate: () => Promise.resolve(null),
    deleteTemplate: () => Promise.resolve(null),
    refetch: () => Promise.resolve()
  };
}