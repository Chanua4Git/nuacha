import React, { createContext, useContext, ReactNode } from 'react';
import { useDemoExpenseContext } from '@/context/DemoExpenseContext';
import { useDemoExpenses } from '@/hooks/useDemoExpenses';
import { useDemoFamilies } from '@/hooks/useDemoFamilies';
import { useDemoCategories } from '@/hooks/useDemoCategories';
import { useDemoReminders } from '@/hooks/useDemoReminders';

// This creates a demo-specific expense context that mimics the real ExpenseContext
// but uses demo data and localStorage instead of Supabase

interface DemoExpenseContextType {
  // Data
  families: any[];
  expenses: any[];
  categories: any[];
  reminders: any[];
  selectedFamily: any;
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  setSelectedFamily: (family: any) => void;
  createExpense: (expenseData: any) => Promise<any>;
  updateExpense: (id: string, updates: any) => Promise<any>;
  deleteExpense: (id: string) => Promise<void>;
  addExpense: (expenseData: any) => Promise<any>; // Alias for backward compatibility
  
  // Filters
  filteredExpenses: (filters?: any) => any[];
  
  // Demo-specific
  clearDemoData: () => void;
  isDemo: true;
  
  // Additional methods to match ExpenseContext interface
  upcomingReminders: () => any[];
}

const DemoExpenseContext = createContext<DemoExpenseContextType | null>(null);

export const DemoExpenseProvider = ({ children }: { children: ReactNode }) => {
  const demoExpenseContext = useDemoExpenseContext();
  const { expenses, createExpense, updateExpense, deleteExpense } = useDemoExpenses();
  const { families, selectedFamily, setSelectedFamily } = useDemoFamilies();
  const { categories } = useDemoCategories();
  const { reminders } = useDemoReminders();

  // Compute upcoming reminders (due within 14 days or overdue)
  const upcomingReminders = () => {
    const now = new Date();
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(now.getDate() + 14);
    
    return reminders.filter(reminder => {
      const dueDate = new Date(reminder.dueDate);
      return dueDate <= fourteenDaysFromNow && !reminder.isCompleted;
    });
  };

  const value: DemoExpenseContextType = {
    families,
    expenses,
    categories,
    reminders,
    selectedFamily,
    isLoading: demoExpenseContext.isLoading,
    setSelectedFamily,
    createExpense,
    updateExpense,
    deleteExpense,
    addExpense: createExpense, // Alias for backward compatibility
    filteredExpenses: demoExpenseContext.filteredExpenses,
    clearDemoData: demoExpenseContext.clearDemoData,
    isDemo: true,
    upcomingReminders
  };

  return (
    <DemoExpenseContext.Provider value={value}>
      {children}
    </DemoExpenseContext.Provider>
  );
};

export const useDemoExpense = () => {
  const context = useContext(DemoExpenseContext);
  if (!context) {
    throw new Error('useDemoExpense must be used within a DemoExpenseProvider');
  }
  return context;
};