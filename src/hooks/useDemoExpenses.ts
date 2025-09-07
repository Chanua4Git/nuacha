import { useDemoExpenseContext } from '@/context/DemoExpenseContext';

export interface DemoExpenseFilters {
  familyId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  place?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export const useDemoExpenses = (filters?: DemoExpenseFilters) => {
  const { 
    expenses, 
    isLoading, 
    createExpense, 
    updateExpense, 
    deleteExpense,
    filteredExpenses 
  } = useDemoExpenseContext();

  // Apply additional filters not handled by the context
  let finalExpenses = expenses;
  
  if (filters) {
    // Apply context filters first
    const contextFilters = {
      categoryId: filters.categoryId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      searchTerm: filters.searchTerm
    };
    finalExpenses = filteredExpenses(contextFilters);

    // Apply remaining filters
    if (filters.place) {
      finalExpenses = finalExpenses.filter(expense => 
        expense.place.toLowerCase().includes(filters.place!.toLowerCase())
      );
    }

    if (filters.minAmount !== undefined) {
      finalExpenses = finalExpenses.filter(expense => expense.amount >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      finalExpenses = finalExpenses.filter(expense => expense.amount <= filters.maxAmount!);
    }
  }

  return {
    expenses: finalExpenses,
    isLoading,
    error: null,
    createExpense,
    updateExpense,
    deleteExpense
  };
};