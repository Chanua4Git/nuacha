
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, CategoryWithChildren } from '@/types/accounting';
import { toast } from 'sonner';

export const useCategories = (familyId?: string) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<CategoryWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        let query = supabase.from('categories').select('*');
        
        if (familyId) {
          query = query.or(`family_id.eq.${familyId},family_id.is.null`);
        }
        
        const { data, error } = await query.order('name');
        
        if (error) throw error;
        
        setCategories(data as Category[]);
        
        // Build hierarchical structure
        const buildHierarchy = (items: Category[], parentId: string | null = null): CategoryWithChildren[] => {
          const result = items
            .filter(item => item.parent_id === parentId)
            .map(item => {
              const children = buildHierarchy(items, item.id);
              return {
                ...item,
                children: children.length > 0 ? children : undefined,
              };
            });
          return result;
        };
        
        setHierarchicalCategories(buildHierarchy(data as Category[]));
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
  }, [familyId]);

  const createCategory = async (categoryData: CategoryWithChildren) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select();
      
      if (error) throw error;
      
      setCategories(prev => [...prev, data[0] as Category]);
      
      toast("Category created successfully", {
        description: "Your new category is ready to use."
      });
      
      return data[0];
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
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      setCategories(prev => 
        prev.map(category => category.id === id ? { ...category, ...updates } : category)
      );
      
      toast("Category updated", {
        description: "Your changes have been saved."
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
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCategories(prev => prev.filter(category => category.id !== id));
      
      toast("Category deleted", {
        description: "The category has been removed."
      });
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast("We couldn't delete your category", {
        description: err.message || "Please try again."
      });
      throw err;
    }
  };

  return {
    categories,
    hierarchicalCategories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory
  };
};
