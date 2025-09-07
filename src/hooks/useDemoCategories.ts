import { useDemoExpenseContext } from '@/context/DemoExpenseContext';

export const useDemoCategories = () => {
  const { categories } = useDemoExpenseContext();

  return {
    categories,
    isLoading: false,
    error: null
  };
};