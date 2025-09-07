import { useContext } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { useDemoExpense } from '@/components/demo/DemoExpenseContext';

// Hook that automatically detects if we're in demo mode and uses the appropriate context
export const useContextAwareExpense = () => {
  // Try to get demo context first
  let demoContext = null;
  try {
    demoContext = useDemoExpense();
  } catch {
    // Not in demo mode, that's fine
  }
  
  // If we have demo context, use it; otherwise use regular context
  if (demoContext) {
    return demoContext;
  }
  
  return useExpense();
};