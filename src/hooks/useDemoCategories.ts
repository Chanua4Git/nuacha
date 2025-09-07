import { useDemoExpenseContext } from '@/context/DemoExpenseContext';
import { getAllDemoCategories } from '@/data/comprehensiveCategories';

export const useDemoCategories = () => {
  const { categories } = useDemoExpenseContext();
  
  // If demo context categories are empty, fall back to comprehensive categories
  const finalCategories = categories.length > 0 ? categories : getAllDemoCategories();

  return {
    categories: finalCategories,
    isLoading: false,
    error: null
  };
};