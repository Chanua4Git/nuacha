import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BudgetCategory, CategoryWithExpenses } from '@/types/budget';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { toast } from 'sonner';

export function useBudgetCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchCategories();
  }, [user]);

  async function fetchCategories() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('group_type', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setCategories((data || []) as BudgetCategory[]);

    } catch (error) {
      console.error('Error fetching budget categories:', error);
      toast.error('Failed to load budget categories');
    } finally {
      setLoading(false);
    }
  }

  async function createCategory(categoryData: Omit<BudgetCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .insert({
          ...categoryData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      await fetchCategories();
      toast.success('Category created successfully');
      return data;

    } catch (error) {
      console.error('Error creating budget category:', error);
      toast.error('Failed to create category');
      return null;
    }
  }

  async function updateCategory(id: string, updates: Partial<BudgetCategory>) {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchCategories();
      toast.success('Category updated successfully');
      return data;

    } catch (error) {
      console.error('Error updating budget category:', error);
      toast.error('Failed to update category');
      return null;
    }
  }

  async function deleteCategory(id: string) {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('budget_categories')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchCategories();
      toast.success('Category deleted successfully');
      return true;

    } catch (error) {
      console.error('Error deleting budget category:', error);
      toast.error('Failed to delete category');
      return false;
    }
  }

  async function initializeDefaultCategories() {
    if (!user) return false;

    try {
      const { error } = await supabase.rpc('create_default_budget_categories', {
        user_uuid: user.id
      });

      if (error) throw error;

      await fetchCategories();
      toast.success('Default categories initialized successfully');
      return true;

    } catch (error) {
      console.error('Error initializing default categories:', error);
      toast.error('Failed to initialize default categories');
      return false;
    }
  }

  const categoriesByGroup = categories.reduce((acc, category) => {
    if (!acc[category.group_type]) {
      acc[category.group_type] = [];
    }
    acc[category.group_type].push(category);
    return acc;
  }, {} as Record<string, BudgetCategory[]>);

  return {
    categories,
    categoriesByGroup,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    initializeDefaultCategories,
    refetch: fetchCategories
  };
}