import { useDemoExpenseContext } from '@/context/DemoExpenseContext';

export const useDemoFamilies = () => {
  const { families, selectedFamily, setSelectedFamily } = useDemoExpenseContext();

  const createFamily = async (familyData: { name: string; description?: string }) => {
    // In demo mode, we don't actually create new families
    // Just show a toast that this would work in the full app
    return Promise.resolve(null);
  };

  const updateFamily = async (id: string, updates: { name: string; description?: string }) => {
    // In demo mode, we don't actually update families
    return Promise.resolve(null);
  };

  const deleteFamily = async (id: string) => {
    // In demo mode, we don't actually delete families
    return Promise.resolve();
  };

  return {
    families,
    selectedFamily,
    setSelectedFamily,
    isLoading: false,
    error: null,
    createFamily,
    updateFamily,
    deleteFamily
  };
};