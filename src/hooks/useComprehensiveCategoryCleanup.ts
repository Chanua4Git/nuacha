import { useState } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useComprehensiveCategoryCleanup = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const runComprehensiveCleanup = async () => {
    if (!user) {
      toast.error('Please log in to clean up categories');
      return false;
    }

    setIsProcessing(true);
    try {
      // Step 1: Run the fixed duplicate cleanup function
      const { data: cleanupResult, error: cleanupError } = await supabase
        .rpc('cleanup_duplicate_categories_advanced');

      if (cleanupError) {
        console.error('Cleanup error:', cleanupError);
        throw cleanupError;
      }

      console.log('Cleanup result:', cleanupResult);

      // Step 2: Reclassify incorrectly grouped categories
      const { data: reclassifyResult, error: reclassifyError } = await supabase
        .rpc('reclassify_categories');

      if (reclassifyError) {
        console.error('Reclassify error:', reclassifyError);
        throw reclassifyError;
      }

      console.log('Reclassify result:', reclassifyResult);

      // Step 3: Ensure budget categories exist for the user
      const { error: budgetError } = await supabase
        .rpc('ensure_user_budget_categories_safe', { user_uuid: user.id });

      if (budgetError) {
        console.error('Budget categories error:', budgetError);
        throw budgetError;
      }

      // Step 4: Map orphaned expenses to budget categories
      const { error: mappingError } = await supabase
        .rpc('map_all_expenses_to_budget_categories');

      if (mappingError) {
        console.error('Mapping error:', mappingError);
        throw mappingError;
      }

      const cleanupCount = cleanupResult?.[0]?.duplicates_removed || 0;
      const reclassifyCount = reclassifyResult?.[0]?.categories_reclassified || 0;

      toast.success('Categories cleaned up successfully!', {
        description: `Removed ${cleanupCount} duplicates, reclassified ${reclassifyCount} categories, and mapped expenses to budget categories.`
      });

      // Force refresh of categories
      setTimeout(() => {
        window.location.reload();
      }, 2000);

      return true;
    } catch (error: any) {
      console.error('Error during comprehensive cleanup:', error);
      
      let errorMessage = 'Please try again or contact support if the issue persists.';
      if (error.message?.includes('permission') || error.message?.includes('ownership')) {
        errorMessage = 'You do not have permission to clean up categories.';
      } else if (error.message?.includes('Row Level Security')) {
        errorMessage = 'Database permission error. Please check your access rights.';
      }

      toast.error('Failed to clean up categories', {
        description: errorMessage
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    runComprehensiveCleanup,
    isProcessing
  };
};