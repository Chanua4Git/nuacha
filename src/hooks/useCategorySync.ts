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
      return false;
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
      
      // Force refresh of categories
      window.location.reload();
      
      return true;
    } catch (error: any) {
      console.error('Error syncing categories:', error);
      let errorMessage = 'Please try again or contact support if the issue persists.';
      
      if (error.message?.includes('permission') || error.message?.includes('ownership')) {
        errorMessage = 'You do not have permission to sync categories for this family.';
      } else if (error.message?.includes('Row Level Security')) {
        errorMessage = 'Database permission error. Please check that you own this family.';
      }
      
      toast.error('Failed to sync categories', {
        description: errorMessage
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncCategoriesForAllFamilies = async (familyIds: string[]) => {
    if (!user) {
      toast.error('Please log in to sync categories');
      return false;
    }

    if (!familyIds || familyIds.length === 0) {
      toast.error('No families found to sync');
      return false;
    }

    setIsSyncing(true);
    try {
      // Ensure budget defaults exist for the user
      await ensureBudgetDefaults(user.id);
      
      // Sync categories for each family with error handling
      let successCount = 0;
      let errorCount = 0;
      
      for (const familyId of familyIds) {
        try {
          await seedRecommendedExpenseCategories(familyId);
          await syncExpenseToBudgetCategories(user.id, familyId);
          successCount++;
        } catch (familyError) {
          console.error(`Error syncing family ${familyId}:`, familyError);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Categories synced for ${successCount} families`, {
          description: errorCount > 0 
            ? `${errorCount} families had errors and were skipped.`
            : 'The new category structure is now available.'
        });
        
        // Force refresh of categories if any succeeded
        window.location.reload();
      } else {
        toast.error('Failed to sync any families', {
          description: 'Please check that you have permission to modify these families.'
        });
      }
      
      return successCount > 0;
    } catch (error: any) {
      console.error('Error syncing categories for all families:', error);
      
      let errorMessage = 'Please try again or contact support if the issue persists.';
      if (error.message?.includes('permission') || error.message?.includes('ownership')) {
        errorMessage = 'You do not have permission to sync categories for one or more families.';
      }
      
      toast.error('Failed to sync categories', {
        description: errorMessage
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