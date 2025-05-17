
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, CategoryWithChildren } from '@/types/accounting';
import { toast } from 'sonner';

interface UseCategoriesOptions {
  familyId?: string;
  includeGeneralCategories?: boolean;
}

export const useCategories = (familyId?: string, includeGeneralCategories: boolean = true) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<CategoryWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Build hierarchical structure from flat categories
  const buildHierarchy = (categories: Category[]): CategoryWithChildren[] => {
    // Create a map of categories by id for easy access
    const categoryMap = new Map<string, CategoryWithChildren>();
    
    // Initialize the map with all categories
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    // Create hierarchical structure
    const rootCategories: CategoryWithChildren[] = [];
    
    // Process each category to build the tree
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id);
      if (!category) return;
      
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        // This is a child category, add it to its parent's children
        const parent = categoryMap.get(cat.parent_id);
        parent?.children?.push(category);
      } else {
        // This is a root category
        rootCategories.push(category);
      }
    });
    
    return rootCategories;
  };

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
          familyId: item.family_id,
          parent_id: item.parent_id,
          budget: item.budget,
          description: item.description,
          icon: item.icon
        }));
        
        setCategories(mappedCategories);
        
        // Build and set hierarchical categories
        const hierarchical = buildHierarchy(mappedCategories);
        setHierarchicalCategories(hierarchical);
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
          family_id: category.familyId,
          parent_id: category.parent_id,
          budget: category.budget,
          description: category.description,
          icon: category.icon
        }])
        .select();
      
      if (error) throw error;
      
      const newCategory: Category = {
        id: data[0].id,
        name: data[0].name,
        color: data[0].color,
        familyId: data[0].family_id,
        parent_id: data[0].parent_id,
        budget: data[0].budget,
        description: data[0].description,
        icon: data[0].icon
      };
      
      setCategories(prev => {
        const updated = [...prev, newCategory];
        setHierarchicalCategories(buildHierarchy(updated));
        return updated;
      });
      
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
      if (updates.parent_id !== undefined) updatesToApply.parent_id = updates.parent_id;
      if (updates.budget !== undefined) updatesToApply.budget = updates.budget;
      if (updates.description !== undefined) updatesToApply.description = updates.description;
      if (updates.icon !== undefined) updatesToApply.icon = updates.icon;
      
      const { data, error } = await supabase
        .from('categories')
        .update(updatesToApply)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      setCategories(prev => {
        const updated = prev.map(category => {
          if (category.id === id) {
            return { ...category, ...updates };
          }
          return category;
        });
        
        setHierarchicalCategories(buildHierarchy(updated));
        return updated;
      });
      
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
      
      setCategories(prev => {
        const updated = prev.filter(category => category.id !== id);
        setHierarchicalCategories(buildHierarchy(updated));
        return updated;
      });
      
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
    hierarchicalCategories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory
  };
};
