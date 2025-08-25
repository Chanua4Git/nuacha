import { useState } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useComprehensiveCategorySeeding = () => {
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);

  const seedComprehensiveCategories = async () => {
    if (!user) {
      toast.error('Please log in to seed categories');
      return false;
    }

    setIsSeeding(true);
    try {
      toast.info('Seeding comprehensive categories...', {
        description: 'This may take a moment'
      });

      // Call the database function to seed comprehensive categories
      const { error } = await supabase.rpc('seed_user_comprehensive_categories', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error seeding categories:', error);
        toast.error('Failed to seed categories', {
          description: error.message
        });
        return false;
      }

      toast.success('Comprehensive categories seeded successfully!', {
        description: 'Your category system now includes all 15 parent categories with subcategories'
      });

      // Force a page refresh to show new categories
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      return true;
    } catch (error) {
      console.error('Error seeding categories:', error);
      toast.error('Failed to seed categories');
      return false;
    } finally {
      setIsSeeding(false);
    }
  };

  const checkNeedsSeeding = async () => {
    if (!user) return false;

    try {
      // Check if user has comprehensive categories
      const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .eq('user_id', user.id)
        .is('family_id', null)
        .eq('is_budget_category', true);

      if (error) {
        console.error('Error checking categories:', error);
        return true; // Assume they need seeding if we can't check
      }

      // Count parent categories (those without parent_id)
      const parentCategories = categories?.filter(c => !c.parent_id) || [];
      
      // Should have 15 parent categories
      const hasComprehensiveStructure = parentCategories.length >= 15;
      
      // Check for key missing categories
      const categoryNames = parentCategories.map(c => c.name.toLowerCase());
      const essentialParents = [
        'housing & utilities',
        'caregiving & medical', 
        'groceries & household supplies',
        'entertainment & leisure',
        'clothing & fashion',
        'technology & electronics'
      ];
      
      const hasMissingEssentials = essentialParents.some(essential => 
        !categoryNames.some(name => name.includes(essential.toLowerCase()))
      );

      return !hasComprehensiveStructure || hasMissingEssentials;
    } catch (error) {
      console.error('Error checking if seeding is needed:', error);  
      return true;
    }
  };

  return {
    seedComprehensiveCategories,
    checkNeedsSeeding,
    isSeeding
  };
};