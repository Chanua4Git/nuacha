
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/expense';
import { toast } from 'sonner';

interface UseCategoriesOptions {
  familyId?: string;
  includeGeneralCategories?: boolean;
}

export const useCategories = (familyId?: string, includeGeneralCategories: boolean = true) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        let query = supabase.from('categories').select('*');
        
        if (familyId) {
          if (includeGeneralCategories) {
            // Get both family-specific and general categories
            query = query.or(`family_id.eq.${familyId},family_id.is.null`);
          } else {
            // Only get family-specific categories
            query = query.eq('family_id', familyId);
          }
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        const mappedCategories: Category[] = data.map(item => ({
          id: item.id,
          name: item.name,
          color: item.color,
          familyId: item.family_id
        }));
        
        setCategories(mappedCategories);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError(err);
        toast("We had trouble loading your categories", {
          description: "Please try refreshing the page."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [familyId, includeGeneralCategories]);

  const createCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: category.name,
          color: category.color,
          family_id: category.familyId
        }])
        .select();
      
      if (error) throw error;
      
      const newCategory: Category = {
        id: data[0].id,
        name: data[0].name,
        color: data[0].color,
        familyId: data[0].family_id
      };
      
      setCategories(prev => [...prev, newCategory]);
      
      toast("Category added successfully", {
        description: `"${category.name}" has been created.`
      });
      
      return newCategory;
    } catch (err: any) {
      console.error('Error creating category:', err);
      toast("We couldn't create your category", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const updatesToApply: any = {};
      
      if (updates.name !== undefined) updatesToApply.name = updates.name;
      if (updates.color !== undefined) updatesToApply.color = updates.color;
      if (updates.familyId !== undefined) updatesToApply.family_id = updates.familyId;
      
      const { data, error } = await supabase
        .from('categories')
        .update(updatesToApply)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      setCategories(prev => prev.map(category => {
        if (category.id === id) {
          return { ...category, ...updates };
        }
        return category;
      }));
      
      toast("Category updated successfully", {
        description: `Changes to "${updates.name || 'category'}" have been saved.`
      });
      
      return data[0];
    } catch (err: any) {
      console.error('Error updating category:', err);
      toast("We couldn't update your category", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // First check if the category is in use by any expenses
      const { data: expensesWithCategory, error: checkError } = await supabase
        .from('expenses')
        .select('id')
        .eq('category', id)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (expensesWithCategory && expensesWithCategory.length > 0) {
        throw new Error('This category is being used by expenses and cannot be deleted.');
      }
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCategories(prev => prev.filter(category => category.id !== id));
      
      toast("Category deleted successfully", {
        description: "The category has been removed."
      });
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast("We couldn't delete this category", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory
  };
};
