import { useEffect } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const useBudgetCategoryInit = () => {
  const { user } = useAuth();

  useEffect(() => {
    const initializeBudgetCategories = async () => {
      if (!user) return;

      try {
        // Check if user has any budget categories
        const { data: existingCategories, error: checkError } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', user.id)
          .is('is_budget_category', true)
          .limit(1);

        if (checkError) {
          console.error('Error checking existing budget categories:', checkError);
          return;
        }

        // If no budget categories exist, create them
        if (!existingCategories || existingCategories.length === 0) {
          const { error: rpcError } = await supabase.rpc('ensure_user_budget_categories', {
            user_uuid: user.id
          });

          if (rpcError) {
            console.error('Error creating default budget categories:', rpcError);
            toast.error('Failed to initialize budget categories');
          } else {
            console.log('Default budget categories created successfully');
            toast.success('Budget categories initialized');
          }
        }
      } catch (error) {
        console.error('Error in budget category initialization:', error);
      }
    };

    initializeBudgetCategories();
  }, [user]);
};