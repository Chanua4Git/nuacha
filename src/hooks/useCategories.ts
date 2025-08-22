import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, CategoryWithCamelCase } from '@/types/expense';
import { toast } from 'sonner';
import { useAuth } from '@/auth/contexts/AuthProvider';

export interface CategoryWithChildren extends CategoryWithCamelCase {
  children?: CategoryWithChildren[];
}

export const useCategories = (familyId?: string, includeGeneralCategories: boolean = true) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryWithCamelCase[]>([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<CategoryWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const buildHierarchy = (categories: CategoryWithCamelCase[]): CategoryWithChildren[] => {
    const categoryMap = new Map<string, CategoryWithChildren>();
    
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    const rootCategories: CategoryWithChildren[] = [];
    
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id);
      if (!category) return;
      
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId);
        parent?.children?.push(category);
      } else {
        rootCategories.push(category);
      }
    });
    
    return rootCategories;
  };

  const fetchCategories = async () => {
    if (!user) {
      console.log('User not available yet, skipping category fetch');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      let query = supabase.from('categories').select('*');
      
      if (familyId) {
        if (includeGeneralCategories) {
          // Include family-specific AND user-level budget categories
          query = query.or(`family_id.eq.${familyId},and(family_id.is.null,user_id.eq.${user.id})`);
        } else {
          // Only family-specific categories (excludes user-level budget categories)
          query = query.eq('family_id', familyId);
        }
      } else if (includeGeneralCategories) {
        query = query.or(`user_id.eq.${user.id},family_id.is.null`);
      } else {
        return;
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      let mappedCategories: CategoryWithCamelCase[] = (data || []).map(item => ({
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
      
      // Enhanced client-side deduplication (case-insensitive by name + family/user context)
      const seen = new Set<string>();
      const deduplicatedCategories = mappedCategories.filter(cat => {
        const key = `${cat.userId || 'null'}-${cat.familyId || 'null'}-${cat.name.toLowerCase()}-${cat.isBudgetCategory || false}`;
        if (seen.has(key)) {
          console.warn('Duplicate category detected and filtered:', cat.name, cat.id);
          return false;
        }
        seen.add(key);
        return true;
      });
      
      setCategories(deduplicatedCategories);
      setHierarchicalCategories(buildHierarchy(deduplicatedCategories));
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

    const channel = supabase
      .channel(`categories-${familyId || 'all'}-${includeGeneralCategories ? 'incl-general' : 'family-only'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          if (!familyId) {
            fetchCategories();
            return;
          }
          const familyMatches = row?.family_id === familyId;
          const isGeneral = row?.family_id == null;
          const relevant = includeGeneralCategories ? (familyMatches || isGeneral) : familyMatches;
          if (relevant) {
            fetchCategories();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, includeGeneralCategories, user]);

  const createCategory = async (category: Omit<CategoryWithCamelCase, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: category.name,
          color: category.color,
          family_id: category.familyId,
          parent_id: category.parentId,
          budget: category.budget,
          description: category.description,
          icon: category.icon
        }])
        .select();
      
      if (error) throw error;
      
      const newCategory: CategoryWithCamelCase = {
        id: data[0].id,
        name: data[0].name,
        color: data[0].color,
        familyId: data[0].family_id,
        parentId: data[0].parent_id,
        budget: data[0].budget,
        description: data[0].description,
        icon: data[0].icon,
        createdAt: data[0].created_at
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

  const updateCategory = async (id: string, updates: Partial<CategoryWithCamelCase>) => {
    try {
      const updatesToApply: any = {};
      
      if (updates.name !== undefined) updatesToApply.name = updates.name;
      if (updates.color !== undefined) updatesToApply.color = updates.color;
      if (updates.familyId !== undefined) updatesToApply.family_id = updates.familyId;
      if (updates.parentId !== undefined) updatesToApply.parent_id = updates.parentId;
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
      
      return {
        id: data[0].id,
        name: data[0].name,
        color: data[0].color,
        familyId: data[0].family_id,
        parentId: data[0].parent_id,
        budget: data[0].budget,
        description: data[0].description,
        icon: data[0].icon,
        createdAt: data[0].created_at
      };
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

      const { error } = await supabase
        .from('categories')
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      setCategories((prev) => {
        const remove = new Set(idsToDelete);
        const updated = prev.filter((c) => !remove.has(c.id));
        setHierarchicalCategories(buildHierarchy(updated));
        return updated;
      });

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
    categories,
    hierarchicalCategories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
};
