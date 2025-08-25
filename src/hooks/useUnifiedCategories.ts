import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, CategoryWithCamelCase } from '@/types/expense';
import { toast } from 'sonner';
import { useAuth } from '@/auth/contexts/AuthProvider';

// Interface for the hierarchical category structure
export interface CategoryWithChildren extends CategoryWithCamelCase {
  children?: CategoryWithChildren[];
}

export type CategoryFetchMode = 
  | 'family-only'      // Only family-level categories
  | 'budget-only'      // Only user-level budget categories  
  | 'unified'          // Both family and budget categories (deduplicated)
  | 'all';             // All categories including demo/general

export interface UseUnifiedCategoriesProps {
  familyId?: string;
  mode?: CategoryFetchMode;
  includeDemo?: boolean;
}

export const useUnifiedCategories = ({ 
  familyId, 
  mode = 'unified',
  includeDemo = false 
}: UseUnifiedCategoriesProps = {}) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryWithCamelCase[]>([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<CategoryWithChildren[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<CategoryWithCamelCase[]>([]);
  const [familyCategories, setFamilyCategories] = useState<CategoryWithCamelCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Build hierarchical structure from flat categories
  const buildHierarchy = (categories: CategoryWithCamelCase[]): CategoryWithChildren[] => {
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
      
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        // This is a child category, add it to its parent's children
        const parent = categoryMap.get(cat.parentId);
        parent?.children?.push(category);
      } else {
        // This is a root category
        rootCategories.push(category);
      }
    });
    
    return rootCategories;
  };

  // Convert database categories to camelCase
  const convertToCategories = (data: any[]): CategoryWithCamelCase[] => {
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      color: item.color,
      familyId: item.family_id,
      parentId: item.parent_id,
      budget: item.budget,
      description: item.description,
      icon: item.icon,
      createdAt: item.created_at,
      userId: item.user_id,
      groupType: item.group_type,
      sortOrder: item.sort_order,
      isBudgetCategory: item.is_budget_category
    }));
  };

  // Fetch categories based on mode
  const fetchCategories = async () => {
    if (!user) {
      console.log('User not available yet, skipping category fetch');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      let familyCats: CategoryWithCamelCase[] = [];
      let budgetCats: CategoryWithCamelCase[] = [];

      // Fetch family-level categories if needed
      if ((mode === 'family-only' || mode === 'unified' || mode === 'all') && familyId) {
        const { data: familyData, error: familyError } = await supabase
          .from('categories')
          .select('*')
          .eq('family_id', familyId)
          .is('is_budget_category', false)
          .order('sort_order', { ascending: true });
        
        if (familyError) throw familyError;
        familyCats = convertToCategories(familyData);
      }

      // Fetch budget categories if needed
      if (mode === 'budget-only' || mode === 'unified' || mode === 'all') {
        const { data: budgetData, error: budgetError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .is('family_id', null)
          .eq('is_budget_category', true)
          .order('sort_order', { ascending: true });
        
        if (budgetError) throw budgetError;
        budgetCats = convertToCategories(budgetData);
      }

      // Set individual category arrays
      setFamilyCategories(familyCats);
      setBudgetCategories(budgetCats);

      // Combine categories based on mode
      let combinedCategories: CategoryWithCamelCase[] = [];
      
      switch (mode) {
        case 'family-only':
          combinedCategories = familyCats;
          break;
        case 'budget-only':
          combinedCategories = budgetCats;
          break;
        case 'unified':
          // Prioritize family categories, fallback to budget categories for missing ones
          const familyNames = new Set(familyCats.map(c => c.name.toLowerCase()));
          const uniqueBudgetCats = budgetCats.filter(c => !familyNames.has(c.name.toLowerCase()));
          combinedCategories = [...familyCats, ...uniqueBudgetCats];
          break;
        case 'all':
          combinedCategories = [...familyCats, ...budgetCats];
          break;
      }

      // Sort by group type and name for consistent display
      combinedCategories.sort((a, b) => {
        const groupOrder = { needs: 0, wants: 1, savings: 2 };
        const aGroup = groupOrder[a.groupType as keyof typeof groupOrder] ?? 3;
        const bGroup = groupOrder[b.groupType as keyof typeof groupOrder] ?? 3;
        
        if (aGroup !== bGroup) return aGroup - bGroup;
        return a.name.localeCompare(b.name);
      });

      setCategories(combinedCategories);
      setHierarchicalCategories(buildHierarchy(combinedCategories));
      
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

  useEffect(() => {
    if (user) {
      fetchCategories();
    }

    // Realtime subscription for category changes
    const channel = supabase
      .channel(`unified-categories-${familyId || 'none'}-${mode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          
          // Check if this change is relevant to our current fetch mode
          const isRelevant = (() => {
            switch (mode) {
              case 'family-only':
                return row?.family_id === familyId && !row?.is_budget_category;
              case 'budget-only':
                return row?.user_id === user?.id && row?.is_budget_category && !row?.family_id;
              case 'unified':
              case 'all':
                return (
                  (row?.family_id === familyId && !row?.is_budget_category) ||
                  (row?.user_id === user?.id && row?.is_budget_category && !row?.family_id)
                );
              default:
                return false;
            }
          })();
          
          if (isRelevant) {
            fetchCategories();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, mode, user]);

  const createCategory = async (category: Omit<CategoryWithCamelCase, 'id'>) => {
    try {
      // Convert camelCase to snake_case for database insert
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: category.name,
          color: category.color,
          family_id: category.familyId,
          parent_id: category.parentId,
          user_id: category.userId,
          budget: category.budget,
          description: category.description,
          icon: category.icon,
          group_type: category.groupType,
          sort_order: category.sortOrder,
          is_budget_category: category.isBudgetCategory || false
        }])
        .select();
      
      if (error) throw error;
      
      // Convert back to camelCase
      const newCategory: CategoryWithCamelCase = convertToCategories(data)[0];
      
      // Update local state
      await fetchCategories(); // Refetch to ensure consistency
      
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

  const updateCategory = async (id: string, updates: Partial<CategoryWithCamelCase>) => {
    try {
      // Convert camelCase to snake_case for database update
      const updatesToApply: any = {};
      
      if (updates.name !== undefined) updatesToApply.name = updates.name;
      if (updates.color !== undefined) updatesToApply.color = updates.color;
      if (updates.familyId !== undefined) updatesToApply.family_id = updates.familyId;
      if (updates.parentId !== undefined) updatesToApply.parent_id = updates.parentId;
      if (updates.userId !== undefined) updatesToApply.user_id = updates.userId;
      if (updates.budget !== undefined) updatesToApply.budget = updates.budget;
      if (updates.description !== undefined) updatesToApply.description = updates.description;
      if (updates.icon !== undefined) updatesToApply.icon = updates.icon;
      if (updates.groupType !== undefined) updatesToApply.group_type = updates.groupType;
      if (updates.sortOrder !== undefined) updatesToApply.sort_order = updates.sortOrder;
      if (updates.isBudgetCategory !== undefined) updatesToApply.is_budget_category = updates.isBudgetCategory;
      
      const { data, error } = await supabase
        .from('categories')
        .update(updatesToApply)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Refetch to ensure consistency
      await fetchCategories();
      
      toast("Category updated successfully", {
        description: `Changes to "${updates.name || 'category'}" have been saved.`
      });
      
      return convertToCategories(data)[0];
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
      // Find the category to delete and all its descendants
      const buildDescendants = (rootId: string) => {
        const ids = new Set<string>();
        const names = new Set<string>();
        const byParent = new Map<string, CategoryWithCamelCase[]>();
        categories.forEach((c) => {
          if (c.parentId) {
            const arr = byParent.get(c.parentId) || [];
            arr.push(c);
            byParent.set(c.parentId, arr);
          }
        });
        const byId = new Map(categories.map((c) => [c.id, c] as const));
        const stack: string[] = [rootId];
        while (stack.length) {
          const current = stack.pop()!;
          if (ids.has(current)) continue;
          ids.add(current);
          const node = byId.get(current);
          if (node) names.add(node.name);
          const children = byParent.get(current) || [];
          children.forEach((child) => stack.push(child.id));
        }
        return { ids: Array.from(ids), names: Array.from(names) };
      };

      const { ids: idsToDelete, names: namesToCheck } = buildDescendants(id);

      // Check for related expenses or receipt line items
      const expenseQuery = supabase
        .from('expenses')
        .select('id')
        .in('category', namesToCheck)
        .limit(1);

      const rliQuery = supabase
        .from('receipt_line_items')
        .select('id')
        .in('category_id', idsToDelete)
        .limit(1);

      const [{ data: expensesWithCategory, error: expErr }, { data: rliWithCategory, error: rliErr }] = await Promise.all([
        expenseQuery,
        rliQuery,
      ]);

      if (expErr) throw expErr;
      if (rliErr) throw rliErr;

      if ((expensesWithCategory && expensesWithCategory.length > 0) || (rliWithCategory && rliWithCategory.length > 0)) {
        const reason = expensesWithCategory && expensesWithCategory.length > 0
          ? 'Some expenses are using this category or its subcategories.'
          : 'Some receipt line items are using this category or its subcategories.';
        throw new Error(`${reason} Please reassign them before deleting.`);
      }

      // Delete the category and all its descendants
      const { error } = await supabase
        .from('categories')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      // Refetch to ensure consistency
      await fetchCategories();

      const deletedCount = idsToDelete.length - 1;
      toast('Category deleted', {
        description: deletedCount > 0
          ? `The category and ${deletedCount} subcategor${deletedCount === 1 ? 'y' : 'ies'} were removed.`
          : 'The category has been removed.',
      });
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast("We couldn't delete this category", {
        description: err.message || 'Please try again.'
      });
      throw err;
    }
  };

  return {
    // Combined categories
    categories,
    hierarchicalCategories,
    
    // Separated categories
    budgetCategories,
    familyCategories,
    
    // State
    isLoading,
    error,
    
    // Actions
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
};