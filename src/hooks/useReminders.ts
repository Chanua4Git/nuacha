
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Reminder } from '@/types/expense';
import { toast } from 'sonner';

export const useReminders = (familyId?: string, upcoming: boolean = false) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchReminders = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('reminders')
          .select('*');
        
        // Filter by family if provided
        if (familyId) {
          query = query.eq('family_id', familyId);
        }
        
        // Filter for upcoming reminders (within the next 14 days)
        if (upcoming) {
          const today = new Date();
          const twoWeeksFromNow = new Date();
          twoWeeksFromNow.setDate(today.getDate() + 14);
          
          const todayStr = today.toISOString().split('T')[0];
          const twoWeeksStr = twoWeeksFromNow.toISOString().split('T')[0];
          
          query = query
            .gte('due_date', todayStr)
            .lte('due_date', twoWeeksStr);
        }
        
        // Sort by due date
        query = query.order('due_date', { ascending: true });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        const mappedReminders: Reminder[] = data.map(item => ({
          id: item.id,
          familyId: item.family_id,
          title: item.title,
          dueDate: item.due_date,
          isRecurring: item.is_recurring,
          frequency: item.frequency,
          // Ensure the type is either 'bill' or 'replacement'
          type: item.type === 'bill' || item.type === 'replacement' ? item.type : 'bill',
          relatedExpenseId: item.related_expense_id
        }));
        
        setReminders(mappedReminders);
      } catch (err: any) {
        console.error('Error fetching reminders:', err);
        setError(err);
        toast("We had trouble loading your reminders", {
          description: "Please try refreshing the page."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminders();
  }, [familyId, upcoming]);

  const createReminder = async (reminderData: Omit<Reminder, 'id'>) => {
    try {
      // Validate that type is either 'bill' or 'replacement'
      const type = reminderData.type === 'bill' || reminderData.type === 'replacement' 
        ? reminderData.type 
        : 'bill';

      const reminderToInsert = {
        family_id: reminderData.familyId,
        title: reminderData.title,
        due_date: reminderData.dueDate,
        is_recurring: reminderData.isRecurring,
        frequency: reminderData.frequency,
        type: type,
        related_expense_id: reminderData.relatedExpenseId
      };
      
      const { data, error } = await supabase
        .from('reminders')
        .insert([reminderToInsert])
        .select();
      
      if (error) throw error;
      
      const newReminder: Reminder = {
        id: data[0].id,
        familyId: data[0].family_id,
        title: data[0].title,
        dueDate: data[0].due_date,
        isRecurring: data[0].is_recurring,
        frequency: data[0].frequency,
        // Ensure the type is either 'bill' or 'replacement'
        type: data[0].type === 'bill' || data[0].type === 'replacement' 
          ? data[0].type as 'bill' | 'replacement' 
          : 'bill',
        relatedExpenseId: data[0].related_expense_id
      };
      
      setReminders(prev => [...prev, newReminder]);
      
      toast("That's saved. Keep going at your own pace.", {
        description: "Your reminder has been set."
      });
      
      return newReminder;
    } catch (err: any) {
      console.error('Error creating reminder:', err);
      toast("We couldn't set your reminder", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      const updatesToApply: any = {};
      
      if (updates.familyId !== undefined) updatesToApply.family_id = updates.familyId;
      if (updates.title !== undefined) updatesToApply.title = updates.title;
      if (updates.dueDate !== undefined) updatesToApply.due_date = updates.dueDate;
      if (updates.isRecurring !== undefined) updatesToApply.is_recurring = updates.isRecurring;
      if (updates.frequency !== undefined) updatesToApply.frequency = updates.frequency;
      if (updates.type !== undefined) {
        // Ensure the type is either 'bill' or 'replacement'
        updatesToApply.type = updates.type === 'bill' || updates.type === 'replacement' 
          ? updates.type 
          : 'bill';
      }
      if (updates.relatedExpenseId !== undefined) updatesToApply.related_expense_id = updates.relatedExpenseId;
      
      const { data, error } = await supabase
        .from('reminders')
        .update(updatesToApply)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      setReminders(prev => prev.map(reminder => {
        if (reminder.id === id) {
          return { ...reminder, ...updates };
        }
        return reminder;
      }));
      
      toast("All set. You're doing beautifully.", {
        description: "Your reminder has been updated."
      });
      
      return data[0];
    } catch (err: any) {
      console.error('Error updating reminder:', err);
      toast("We couldn't update your reminder", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setReminders(prev => prev.filter(reminder => reminder.id !== id));
      
      toast("That's taken care of.", {
        description: "The reminder has been removed."
      });
    } catch (err: any) {
      console.error('Error deleting reminder:', err);
      toast("We couldn't remove this reminder", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  return {
    reminders,
    isLoading,
    error,
    createReminder,
    updateReminder,
    deleteReminder
  };
};
