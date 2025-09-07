import { useDemoExpenseContext } from '@/context/DemoExpenseContext';

export const useDemoReminders = () => {
  const { reminders } = useDemoExpenseContext();

  const createReminder = async (reminderData: any) => {
    // In demo mode, just show toast that this would work
    return Promise.resolve(null);
  };

  const updateReminder = async (id: string, updates: any) => {
    // In demo mode, just show toast that this would work
    return Promise.resolve(null);
  };

  const deleteReminder = async (id: string) => {
    // In demo mode, just show toast that this would work
    return Promise.resolve();
  };

  return {
    reminders,
    isLoading: false,
    error: null,
    createReminder,
    updateReminder,
    deleteReminder
  };
};