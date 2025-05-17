
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Family, Category, Expense, Reminder } from '@/types/expense';
import { useFamilies } from '@/hooks/useFamilies';
import { useExpenses } from '@/hooks/useExpenses';
import { useReminders } from '@/hooks/useReminders';
import { useCategories } from '@/hooks/useCategories';
import { toast } from "sonner";

interface ExpenseContextType {
  families: Family[];
  categories: Category[];
  expenses: Expense[];
  reminders: Reminder[];
  selectedFamily: Family | null;
  setSelectedFamily: (family: Family | null) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense | undefined>;
  addReminder: (reminder: Omit<Reminder, 'id'>) => Promise<Reminder | undefined>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<any>;
  deleteExpense: (id: string) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<any>;
  deleteReminder: (id: string) => Promise<void>;
  filteredExpenses: (filters: ExpenseFilters) => Expense[];
  upcomingReminders: () => Reminder[];
  isLoading: boolean;
}

export interface ExpenseFilters {
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  place?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  // State for the selected family
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  
  // Loading state for the entire context
  const [isLoading, setIsLoading] = useState(true);
  
  // Get families from the hook
  const { 
    families, 
    isLoading: familiesLoading,
    createFamily,
    updateFamily,
    deleteFamily
  } = useFamilies();
  
  // Get expenses using the selected family
  const {
    expenses,
    isLoading: expensesLoading,
    createExpense,
    updateExpense,
    deleteExpense
  } = useExpenses({ familyId: selectedFamily?.id });
  
  // Get reminders using the selected family
  const {
    reminders,
    isLoading: remindersLoading,
    createReminder,
    updateReminder,
    deleteReminder
  } = useReminders(selectedFamily?.id);
  
  // Get categories using the selected family - fix the parameter passing
  const {
    categories,
    isLoading: categoriesLoading
  } = useCategories(selectedFamily?.id, true);
  
  // Set the first family as selected when families are loaded
  useEffect(() => {
    if (families.length > 0 && !selectedFamily) {
      setSelectedFamily(families[0]);
    }
    
    // Update overall loading state
    setIsLoading(familiesLoading || expensesLoading || remindersLoading || categoriesLoading);
  }, [families, familiesLoading, expensesLoading, remindersLoading, categoriesLoading, selectedFamily]);

  // Add a new expense
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      const newExpense = await createExpense(expense);
      
      // If expense needs replacement, add a reminder automatically
      if (expense.needsReplacement && expense.replacementFrequency && expense.nextReplacementDate && newExpense) {
        await createReminder({
          familyId: expense.familyId,
          title: `${expense.description} replacement`,
          dueDate: expense.nextReplacementDate,
          isRecurring: true,
          frequency: expense.replacementFrequency,
          type: 'replacement',
          relatedExpenseId: newExpense.id,
        });
      }
      
      return newExpense;
    } catch (error) {
      console.error('Error in addExpense:', error);
      return undefined;
    }
  };

  // Add a new reminder
  const addReminder = async (reminder: Omit<Reminder, 'id'>) => {
    try {
      return await createReminder(reminder);
    } catch (error) {
      console.error('Error in addReminder:', error);
      return undefined;
    }
  };

  // Filter expenses based on provided filters
  const filteredExpenses = (filters: ExpenseFilters): Expense[] => {
    return expenses.filter(expense => {      
      // Filter by category
      if (filters.categoryId && expense.category !== filters.categoryId) {
        return false;
      }
      
      // Filter by date range
      if (filters.startDate && new Date(expense.date) < new Date(filters.startDate)) {
        return false;
      }
      
      if (filters.endDate && new Date(expense.date) > new Date(filters.endDate)) {
        return false;
      }
      
      // Filter by place
      if (filters.place && !expense.place.toLowerCase().includes(filters.place.toLowerCase())) {
        return false;
      }
      
      // Filter by amount range
      if (filters.minAmount !== undefined && expense.amount < filters.minAmount) {
        return false;
      }
      
      if (filters.maxAmount !== undefined && expense.amount > filters.maxAmount) {
        return false;
      }
      
      // Filter by search term (searches in description and place)
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

  // Get upcoming reminders (due within the next 14 days)
  const upcomingReminders = (): Reminder[] => {
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);
    
    return reminders.filter(reminder => {
      const dueDate = new Date(reminder.dueDate);
      return dueDate >= today && dueDate <= twoWeeksFromNow;
    }).sort((a, b) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  };

  return (
    <ExpenseContext.Provider
      value={{
        families,
        categories,
        expenses,
        reminders,
        selectedFamily,
        setSelectedFamily,
        addExpense,
        addReminder,
        updateExpense,
        deleteExpense,
        updateReminder,
        deleteReminder,
        filteredExpenses,
        upcomingReminders,
        isLoading
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
