
import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef } from 'react';
import { Family, Expense, CategoryWithCamelCase, Reminder } from '@/types/expense';
import { useFamilies } from '@/hooks/useFamilies';
import { useExpenses } from '@/hooks/useExpenses';
import { useUnifiedCategories } from '@/hooks/useUnifiedCategories';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useReminders } from '@/hooks/useReminders';

// Modified context type to ensure user data persistence
export const ExpenseContext = createContext<{
  families: Family[];
  expenses: Expense[];
  categories: CategoryWithCamelCase[];
  selectedFamily: Family | null;
  setSelectedFamily: (family: Family | null) => void;
  isLoading: boolean;
  filteredExpenses: (filters?: ExpenseFilters) => Expense[];
  createExpense: (expenseData: Omit<Expense, 'id'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<any>;
  deleteExpense: (id: string) => Promise<void>;
  createFamily: (familyData: Omit<Family, 'id'>) => Promise<Family>;
  updateFamily: (id: string, updates: Partial<Family>) => Promise<any>;
  deleteFamily: (id: string) => Promise<void>;
  addExpense: (expenseData: Omit<Expense, 'id'>) => Promise<Expense>; // Added for backward compatibility
  upcomingReminders: () => Reminder[]; // Added for RemindersList
}>({
  families: [],
  expenses: [],
  categories: [],
  selectedFamily: null,
  setSelectedFamily: () => {},
  isLoading: false,
  filteredExpenses: () => [],
  createExpense: async () => ({ id: '', familyId: '', amount: 0, description: '', category: '', date: '', place: '' }),
  updateExpense: async () => ({}),
  deleteExpense: async () => {},
  createFamily: async () => ({ id: '', name: '', color: '' }),
  updateFamily: async () => ({}),
  deleteFamily: async () => {},
  addExpense: async () => ({ id: '', familyId: '', amount: 0, description: '', category: '', date: '', place: '' }),
  upcomingReminders: () => [],
});

export const useExpense = () => useContext(ExpenseContext);

export interface ExpenseFilters {
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const [selectedFamilyState, setSelectedFamilyState] = useState<Family | null>(null);
  const selectedFamilyRef = useRef<Family | null>(null);
  const selectedFamily = selectedFamilyState;

  const { user } = useAuth();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(
    localStorage.getItem('selectedFamilyId')
  );

  // Get families with the current user filter
  const { 
    families, 
    isLoading: familiesLoading,
    createFamily,
    updateFamily,
    deleteFamily 
  } = useFamilies();

  // Get reminders based on the selected family
  const { reminders, isLoading: remindersLoading } = useReminders(selectedFamily?.id);

  // Set the selected family based on ID or first available
  useEffect(() => {
    if (!selectedFamily && families.length > 0) {
      // If we have a stored family ID, try to use it
      const storedFamilyId = localStorage.getItem('selectedFamilyId');
      if (storedFamilyId) {
        const storedFamily = families.find(f => f.id === storedFamilyId);
        if (storedFamily) {
          setSelectedFamily(storedFamily);
          return;
        }
      }
      // Otherwise use the first family
      setSelectedFamily(families[0]);
    }
  }, [families, selectedFamily]);

  // Add effect to clear selected family if it no longer exists
  useEffect(() => {
    if (selectedFamily && families.length > 0 && !families.find(f => f.id === selectedFamily.id)) {
      console.log('Selected family no longer exists, resetting to first available');
      setSelectedFamily(families[0]);
    }
  }, [families, selectedFamily]);

  // Auto-create default family for brand new users
  useEffect(() => {
    const autoCreateDefaultFamily = async () => {
      if (user && !familiesLoading && families.length === 0) {
        const hasTriedAutoCreate = sessionStorage.getItem('hasTriedAutoCreateFamily');
        
        if (!hasTriedAutoCreate) {
          console.log('✨ New user detected - auto-creating default family...');
          sessionStorage.setItem('hasTriedAutoCreateFamily', 'true');
          
          try {
            const newFamily = await createFamily({
              name: 'My Household',
              color: '#5A7684'
            });
            
            console.log('✅ Default family created:', newFamily.name);
          } catch (error) {
            console.error('Failed to auto-create default family:', error);
          }
        }
      }
    };
    
    autoCreateDefaultFamily();
  }, [user, familiesLoading, families.length, createFamily]);

  // Persist selected family ID to localStorage
  useEffect(() => {
    if (selectedFamily) {
      localStorage.setItem('selectedFamilyId', selectedFamily.id);
    }
  }, [selectedFamily]);

  // Get categories based on the selected family
  const { 
    categories,
    isLoading: categoriesLoading 
  } = useUnifiedCategories({ 
    familyId: selectedFamily?.id, 
    mode: 'family-only' 
  });

  // Get expenses based on the selected family - only fetch when family is properly selected
  const { 
    expenses,
    isLoading: expensesLoading,
    createExpense,
    updateExpense,
    deleteExpense 
  } = useExpenses({ 
    familyId: selectedFamily?.id 
  });

  // Add debug logging for family selection changes
  useEffect(() => {
    if (selectedFamily) {
      console.log('ExpenseContext: Family selected:', selectedFamily.name, selectedFamily.id);
    } else {
      console.log('ExpenseContext: No family selected');
    }
  }, [selectedFamily]);

  const setSelectedFamily = (family: Family | null) => {
    selectedFamilyRef.current = family;
    setSelectedFamilyState(family);
  };

  const filteredExpenses = (filters?: ExpenseFilters) => {
    if (!filters) {
      return expenses;
    }

    return expenses.filter(expense => {
      if (filters.categoryId && expense.category !== filters.categoryId) {
        return false;
      }

      if (filters.startDate && expense.date < filters.startDate) {
        return false;
      }

      if (filters.endDate && expense.date > filters.endDate) {
        return false;
      }

      if (filters.minAmount !== undefined && expense.amount < filters.minAmount) {
        return false;
      }

      if (filters.maxAmount !== undefined && expense.amount > filters.maxAmount) {
        return false;
      }

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const descriptionMatch = expense.description.toLowerCase().includes(term);
        const placeMatch = expense.place.toLowerCase().includes(term);
        
        if (!descriptionMatch && !placeMatch) {
          return false;
        }
      }

      return true;
    });
  };

  // For backward compatibility with existing code
  const addExpense = createExpense;

  // Function to get upcoming reminders for RemindersList
  const upcomingReminders = () => {
    if (!selectedFamily) return [];
    return reminders.filter(reminder => {
      const dueDate = new Date(reminder.dueDate);
      const today = new Date();
      // Show reminders that are due within the next 14 days or are overdue
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 14;
    });
  };

  const isLoading = familiesLoading || categoriesLoading || expensesLoading || remindersLoading;

  const value = useMemo(() => ({
    families,
    expenses,
    categories,
    selectedFamily,
    setSelectedFamily,
    isLoading,
    filteredExpenses,
    // Also expose these functions to components
    createExpense,
    updateExpense,
    deleteExpense,
    createFamily,
    updateFamily,
    deleteFamily,
    // Additional functions for backward compatibility
    addExpense,
    upcomingReminders
  }), [
    families, 
    expenses,
    categories,
    selectedFamily,
    isLoading,
    createExpense,
    updateExpense,
    deleteExpense,
    createFamily,
    updateFamily,
    deleteFamily,
    reminders
  ]);

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};
