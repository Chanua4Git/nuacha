
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Family, Category, Expense, Reminder, families, categories, expenses, reminders } from '../data/mockData';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/components/ui/sonner";

interface ExpenseContextType {
  families: Family[];
  categories: Category[];
  expenses: Expense[];
  reminders: Reminder[];
  selectedFamily: Family | null;
  setSelectedFamily: (family: Family | null) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  updateReminder: (reminder: Reminder) => void;
  deleteReminder: (id: string) => void;
  filteredExpenses: (filters: ExpenseFilters) => Expense[];
  upcomingReminders: () => Reminder[];
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
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(families[0]);
  const [expensesList, setExpensesList] = useState<Expense[]>(expenses);
  const [remindersList, setRemindersList] = useState<Reminder[]>(reminders);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: uuidv4() };
    
    // If expense needs replacement, add a reminder automatically
    if (expense.needsReplacement && expense.replacementFrequency && expense.nextReplacementDate) {
      addReminder({
        familyId: expense.familyId,
        title: `${expense.description} replacement`,
        dueDate: expense.nextReplacementDate,
        isRecurring: true,
        frequency: expense.replacementFrequency,
        type: 'replacement',
        relatedExpenseId: newExpense.id,
      });
    }
    
    setExpensesList(prev => [...prev, newExpense]);
    toast.success('Expense added successfully');
    return newExpense;
  };

  const updateExpense = (expense: Expense) => {
    setExpensesList(prev => prev.map(item => item.id === expense.id ? expense : item));
    
    // Update related reminder if exists
    if (expense.needsReplacement && expense.nextReplacementDate) {
      const relatedReminder = remindersList.find(r => r.relatedExpenseId === expense.id);
      if (relatedReminder) {
        updateReminder({
          ...relatedReminder,
          title: `${expense.description} replacement`,
          dueDate: expense.nextReplacementDate,
          frequency: expense.replacementFrequency,
        });
      }
    }
    
    toast.success('Expense updated successfully');
  };

  const deleteExpense = (id: string) => {
    setExpensesList(prev => prev.filter(item => item.id !== id));
    
    // Delete related reminders
    setRemindersList(prev => prev.filter(item => item.relatedExpenseId !== id));
    
    toast.success('Expense deleted successfully');
  };

  const addReminder = (reminder: Omit<Reminder, 'id'>) => {
    const newReminder = { ...reminder, id: uuidv4() };
    setRemindersList(prev => [...prev, newReminder]);
    toast.success('Reminder added successfully');
    return newReminder;
  };

  const updateReminder = (reminder: Reminder) => {
    setRemindersList(prev => prev.map(item => item.id === reminder.id ? reminder : item));
    toast.success('Reminder updated successfully');
  };

  const deleteReminder = (id: string) => {
    setRemindersList(prev => prev.filter(item => item.id !== id));
    toast.success('Reminder deleted successfully');
  };

  const filteredExpenses = (filters: ExpenseFilters): Expense[] => {
    return expensesList.filter(expense => {
      // Always filter by selected family
      if (selectedFamily && expense.familyId !== selectedFamily.id) {
        return false;
      }
      
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

  const upcomingReminders = (): Reminder[] => {
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);
    
    return remindersList.filter(reminder => {
      // Only show reminders for the selected family
      if (selectedFamily && reminder.familyId !== selectedFamily.id) {
        return false;
      }
      
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
        expenses: expensesList,
        reminders: remindersList,
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
