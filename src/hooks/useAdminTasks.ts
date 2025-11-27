import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AdminTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useAdminTasks() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('admin_tasks_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_tasks' },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTasks() {
    try {
      const { data, error } = await supabase
        .from('admin_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }

  async function createTask(task: Omit<AdminTask, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
    try {
      const { data, error } = await supabase
        .from('admin_tasks')
        .insert([task])
        .select()
        .single();

      if (error) throw error;
      toast.success('Task created');
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
      throw error;
    }
  }

  async function updateTask(id: string, updates: Partial<AdminTask>) {
    try {
      const { error } = await supabase
        .from('admin_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Task updated');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      throw error;
    }
  }

  async function deleteTask(id: string) {
    try {
      const { error } = await supabase
        .from('admin_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      throw error;
    }
  }

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: fetchTasks,
  };
}
