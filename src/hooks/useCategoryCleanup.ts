import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/auth/contexts/AuthProvider';

export const useCategoryCleanup = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const validateCategories = async () => {
    if (!user) {
      toast.error('You must be logged in to validate categories');
      return;
    }

    setIsProcessing(true);
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},family_id.in.(select id from families where user_id = ${user.id})`);

      if (error) throw error;

      // Check for potential issues
      const issues = [];
      const nameGroups = new Map<string, any[]>();

      categories?.forEach(cat => {
        const key = `${cat.user_id}-${cat.family_id}-${cat.name.toLowerCase()}-${cat.is_budget_category}`;
        if (!nameGroups.has(key)) {
          nameGroups.set(key, []);
        }
        nameGroups.get(key)!.push(cat);
      });

      nameGroups.forEach((cats, key) => {
        if (cats.length > 1) {
          issues.push({
            type: 'duplicate',
            message: `Found ${cats.length} categories with name "${cats[0].name}"`,
            categories: cats
          });
        }
      });

      if (issues.length > 0) {
        toast.warning(`Found ${issues.length} category issues`, {
          description: 'Consider running the cleanup process.'
        });
      } else {
        toast.success('No category validation issues found');
      }

      return { issues, categories };
    } catch (error: any) {
      console.error('Error validating categories:', error);
      toast.error('Failed to validate categories', {
        description: error.message
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const runCategoryCleanup = async () => {
    if (!user) {
      toast.error('You must be logged in to run cleanup');
      return;
    }

    setIsProcessing(true);
    try {
      // Call the existing cleanup function
      const { data, error } = await supabase.rpc('cleanup_duplicate_categories_advanced');
      
      if (error) throw error;

      const result = data?.[0];
      if (result) {
        if (result.duplicates_removed > 0) {
          toast.success('Category cleanup completed', {
            description: result.message
          });
          // Trigger page reload to refresh category data
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.success('No duplicate categories found');
        }
      }

      return result;
    } catch (error: any) {
      console.error('Error running category cleanup:', error);
      toast.error('Failed to run category cleanup', {
        description: error.message
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const fixOrphanedReferences = async () => {
    if (!user) {
      toast.error('You must be logged in to fix references');
      return;
    }

    setIsProcessing(true);
    try {
      // Update orphaned expense references to budget categories
      const { error: expenseError } = await supabase.rpc('map_all_expenses_to_budget_categories');
      
      if (expenseError) throw expenseError;

      toast.success('Fixed orphaned category references');
      return true;
    } catch (error: any) {
      console.error('Error fixing orphaned references:', error);
      toast.error('Failed to fix orphaned references', {
        description: error.message
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const ensureBudgetCategories = async () => {
    if (!user) {
      toast.error('You must be logged in to ensure budget categories');
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('ensure_user_budget_categories_safe', {
        user_uuid: user.id
      });
      
      if (error) throw error;

      toast.success('Budget categories ensured');
      return true;
    } catch (error: any) {
      console.error('Error ensuring budget categories:', error);
      toast.error('Failed to ensure budget categories', {
        description: error.message
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const runComprehensiveCleanup = async () => {
    if (!user) {
      toast.error('You must be logged in to run comprehensive cleanup');
      return;
    }

    setIsProcessing(true);
    try {
      toast.loading('Running comprehensive category cleanup...', { duration: 2000 });

      // Step 1: Ensure budget categories exist
      await ensureBudgetCategories();
      
      // Step 2: Run duplicate cleanup
      await runCategoryCleanup();
      
      // Step 3: Fix orphaned references
      await fixOrphanedReferences();
      
      toast.success('Comprehensive cleanup completed successfully', {
        description: 'Your categories have been optimized.'
      });

      // Trigger page reload to refresh all data
      setTimeout(() => window.location.reload(), 1500);
      
      return true;
    } catch (error: any) {
      console.error('Error in comprehensive cleanup:', error);
      toast.error('Comprehensive cleanup failed', {
        description: error.message
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    validateCategories,
    runCategoryCleanup,
    fixOrphanedReferences,
    ensureBudgetCategories,
    runComprehensiveCleanup,
    isProcessing
  };
};