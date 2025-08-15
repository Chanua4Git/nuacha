import { useState } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { toast } from 'sonner';
import { 
  validateCategoryConsistency, 
  migrateCategoriesForUser, 
  createDefaultCategorizationRules,
  bulkCategorizeExpenses 
} from '@/utils/enhancedCategorySync';

export const useEnhancedCategorySync = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const validateCategories = async () => {
    if (!user) {
      toast.error('Please log in to validate categories');
      return false;
    }

    setIsProcessing(true);
    try {
      const result = await validateCategoryConsistency(user.id);
      
      if (result.success) {
        toast.success('Category validation complete', {
          description: result.message
        });
      } else {
        toast.warning('Category issues found', {
          description: `${result.issues?.length || 0} issues detected. Consider running migration.`
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error validating categories:', error);
      toast.error('Failed to validate categories');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const migrateCategories = async () => {
    if (!user) {
      toast.error('Please log in to migrate categories');
      return false;
    }

    setIsProcessing(true);
    try {
      const result = await migrateCategoriesForUser(user.id);
      
      if (result.success) {
        toast.success('Category migration complete', {
          description: result.message
        });
        
        // Force refresh
        window.location.reload();
      } else {
        toast.error('Migration failed', {
          description: result.message
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error migrating categories:', error);
      toast.error('Migration failed');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const setupVendorRules = async () => {
    if (!user) {
      toast.error('Please log in to setup vendor rules');
      return false;
    }

    setIsProcessing(true);
    try {
      const result = await createDefaultCategorizationRules(user.id);
      
      if (result.success) {
        toast.success('Vendor rules created', {
          description: result.message
        });
      } else {
        toast.error('Failed to create vendor rules', {
          description: result.message
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error creating vendor rules:', error);
      toast.error('Failed to create vendor rules');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const bulkCategorize = async () => {
    if (!user) {
      toast.error('Please log in to bulk categorize');
      return false;
    }

    setIsProcessing(true);
    try {
      const result = await bulkCategorizeExpenses(user.id);
      
      if (result.success) {
        toast.success('Bulk categorization complete', {
          description: result.message
        });
        
        // Force refresh to show updated categories
        window.location.reload();
      } else {
        toast.error('Bulk categorization failed', {
          description: result.message
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error bulk categorizing:', error);
      toast.error('Bulk categorization failed');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const runFullCategoryOptimization = async () => {
    if (!user) {
      toast.error('Please log in to optimize categories');
      return false;
    }

    setIsProcessing(true);
    try {
      toast.info('Starting category optimization...', {
        description: 'This may take a few moments'
      });

      // Step 1: Validate current state
      const validation = await validateCategoryConsistency(user.id);
      
      // Step 2: Migrate if needed
      if (!validation.success && validation.issues && validation.issues.length > 0) {
        await migrateCategoriesForUser(user.id);
      }

      // Step 3: Setup vendor rules
      await createDefaultCategorizationRules(user.id);

      // Step 4: Bulk categorize existing expenses
      const bulkResult = await bulkCategorizeExpenses(user.id);

      toast.success('Category optimization complete!', {
        description: `Optimized categories and categorized ${bulkResult.categorizedCount || 0} expenses`
      });

      // Force refresh to show all changes
      window.location.reload();

      return true;
    } catch (error) {
      console.error('Error optimizing categories:', error);
      toast.error('Category optimization failed');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    validateCategories,
    migrateCategories,
    setupVendorRules,
    bulkCategorize,
    runFullCategoryOptimization,
    isProcessing
  };
};