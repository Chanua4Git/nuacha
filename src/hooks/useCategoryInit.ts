import { useEffect } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';

export const useCategoryInit = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      // Ensure user has default budget categories
      ensureUserBudgetCategories(user.id);
    }
  }, [user?.id]);

  const ensureUserBudgetCategories = async (userId: string) => {
    try {
      await supabase.rpc('ensure_user_budget_categories', {
        user_uuid: userId
      });
    } catch (error) {
      console.error('Error ensuring budget categories:', error);
    }
  };

  return { ensureUserBudgetCategories };
};