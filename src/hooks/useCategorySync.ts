import { useState } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { ensureBudgetDefaults, seedRecommendedExpenseCategories, syncExpenseToBudgetCategories } from '@/utils/categorySync';
import { toast } from 'sonner';

export const useCategorySync = () => {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncCategoriesForFamily = async (familyId: string) => {
    if (!user) {
      toast.error('Please log in to sync categories');
      return;
    }

    setIsSyncing(true);
    try {
      // Step 1: Ensure budget defaults exist for the user
      await ensureBudgetDefaults(user.id);
      
      // Step 2: Seed recommended expense categories for the family
      await seedRecommendedExpenseCategories(familyId);
      
      // Step 3: Sync expense categories to budget categories
      await syncExpenseToBudgetCategories(user.id, familyId);
      
      toast.success('Categories synced successfully', {
        description: 'The new 12-category structure is now available for this family.'
      });
      
      return true;
    } catch (error) {
      console.error('Error syncing categories:', error);
      toast.error('Failed to sync categories', {
        description: 'Please try again or contact support if the issue persists.'
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncCategoriesForAllFamilies = async (familyIds: string[]) => {
    if (!user) {
      toast.error('Please log in to sync categories');
      return;
    }

    setIsSyncing(true);
    try {
      // Ensure budget defaults exist for the user
      await ensureBudgetDefaults(user.id);
      
      // Sync categories for each family
      for (const familyId of familyIds) {
        await seedRecommendedExpenseCategories(familyId);
        await syncExpenseToBudgetCategories(user.id, familyId);
      }
      
      toast.success('Categories synced for all families', {
        description: `Updated ${familyIds.length} families with the new category structure.`
      });
      
      return true;
    } catch (error) {
      console.error('Error syncing categories for all families:', error);
      toast.error('Failed to sync categories', {
        description: 'Please try again or contact support if the issue persists.'
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncCategoriesForFamily,
    syncCategoriesForAllFamilies,
    isSyncing
  };
};