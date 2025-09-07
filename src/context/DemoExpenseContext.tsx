import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Expense, OCRResult } from '@/types/expense';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Mock families for demo
const mockFamilies = [
  {
    id: 'demo-family-1',
    name: 'Demo Family',
    description: 'Your demo family for testing',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock categories for demo
const mockCategories = [
  { id: 'groceries', name: 'Groceries', color: '#10b981' },
  { id: 'dining', name: 'Dining Out', color: '#f59e0b' },
  { id: 'transportation', name: 'Transportation', color: '#3b82f6' },
  { id: 'entertainment', name: 'Entertainment', color: '#8b5cf6' },
  { id: 'shopping', name: 'Shopping', color: '#ef4444' },
  { id: 'utilities', name: 'Utilities', color: '#06b6d4' },
  { id: 'healthcare', name: 'Healthcare', color: '#f97316' },
  { id: 'other', name: 'Other', color: '#6b7280' }
];

// Mock reminders for demo
const mockReminders = [
  {
    id: 'demo-reminder-1',
    familyId: 'demo-family-1',
    title: 'Insurance Payment Due',
    description: 'Monthly insurance premium',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    amount: 250.00,
    isCompleted: false
  },
  {
    id: 'demo-reminder-2',
    familyId: 'demo-family-1',
    title: 'Replace Air Filters',
    description: 'HVAC air filter replacement',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    amount: 25.00,
    isCompleted: false
  }
];

const DEMO_STORAGE_KEY = 'nuacha-demo-expenses';

interface DemoExpenseContextType {
  // Data
  expenses: Expense[];
  families: typeof mockFamilies;
  categories: typeof mockCategories;
  reminders: typeof mockReminders;
  selectedFamily: { id: string; name: string; description: string; created_at: string; updated_at: string } | null;
  isLoading: boolean;
  isDemo: true;
  
  // Actions
  createExpense: (expenseData: Omit<Expense, 'id'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  setSelectedFamily: (family: any) => void;
  clearDemoData: () => void;
  
  // Filters
  filteredExpenses: (filters?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
  }) => Expense[];
}

const DemoExpenseContext = createContext<DemoExpenseContextType | null>(null);

export const DemoExpenseProvider = ({ children }: { children: ReactNode }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedFamily, setSelectedFamilyState] = useState(mockFamilies[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Load demo data from localStorage on mount
  useEffect(() => {
    const loadDemoData = () => {
      try {
        const stored = localStorage.getItem(DEMO_STORAGE_KEY);
        if (stored) {
          const parsedExpenses = JSON.parse(stored);
          setExpenses(parsedExpenses);
        }
      } catch (error) {
        console.error('Error loading demo data:', error);
      }
    };
    
    loadDemoData();
  }, []);

  // Save to localStorage whenever expenses change
  useEffect(() => {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving demo data:', error);
    }
  }, [expenses]);

  const createExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newExpense: Expense = {
      ...expenseData,
      id: `demo-expense-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      familyId: selectedFamily.id
    };
    
    setExpenses(prev => [newExpense, ...prev]);
    setIsLoading(false);
    
    toast("That's saved. Keep going at your own pace.", {
      description: "Your demo expense has been added successfully."
    });
    
    return newExpense;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>): Promise<Expense> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...expense, ...updates } : expense
    ));
    
    const updatedExpense = expenses.find(e => e.id === id);
    if (!updatedExpense) {
      throw new Error('Expense not found');
    }
    
    setIsLoading(false);
    
    toast("All set. You're doing beautifully.", {
      description: "Your demo expense has been updated."
    });
    
    return { ...updatedExpense, ...updates };
  };

  const deleteExpense = async (id: string): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setExpenses(prev => prev.filter(expense => expense.id !== id));
    setIsLoading(false);
    
    toast("That's taken care of.", {
      description: "The demo expense has been removed."
    });
  };

  const setSelectedFamily = (family: any) => {
    setSelectedFamilyState(family);
  };

  const clearDemoData = () => {
    setExpenses([]);
    localStorage.removeItem(DEMO_STORAGE_KEY);
    toast("Demo data cleared", {
      description: "Starting fresh with a clean slate."
    });
  };

  const filteredExpenses = (filters?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
  }) => {
    let filtered = expenses;

    if (filters?.categoryId) {
      filtered = filtered.filter(expense => expense.category === filters.categoryId);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(expense => expense.date >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(expense => expense.date <= filters.endDate!);
    }

    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(term) ||
        expense.place.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const value: DemoExpenseContextType = {
    expenses,
    families: mockFamilies,
    categories: mockCategories,
    reminders: mockReminders,
    selectedFamily,
    isLoading,
    isDemo: true,
    createExpense,
    updateExpense,
    deleteExpense,
    setSelectedFamily,
    clearDemoData,
    filteredExpenses
  };

  return (
    <DemoExpenseContext.Provider value={value}>
      {children}
    </DemoExpenseContext.Provider>
  );
};

export const useDemoExpenseContext = () => {
  const context = useContext(DemoExpenseContext);
  if (!context) {
    throw new Error('useDemoExpenseContext must be used within a DemoExpenseProvider');
  }
  return context;
};