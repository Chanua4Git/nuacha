import { useState } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { comprehensiveCategories } from '@/data/comprehensiveCategories';

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

      // Seed categories directly from the comprehensive list (user-level budget categories)
      const upsert = async (
        name: string,
        group: 'needs' | 'wants' | 'savings',
        parentId: string | null,
        sortOrder: number
      ): Promise<string> => {
        const { data: existing } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', user.id)
          .is('family_id', null)
          .eq('is_budget_category', true)
          .eq('name', name)
          .maybeSingle();
        if (existing?.id) return existing.id as string;

        const { data: inserted, error: insertError } = await supabase
          .from('categories')
          .insert({
            user_id: user.id,
            family_id: null,
            is_budget_category: true,
            name,
            group_type: group,
            parent_id: parentId,
            sort_order: sortOrder,
            color: group === 'needs' ? '#EF4444' : group === 'savings' ? '#22C55E' : '#F97316'
          })
          .select('id')
          .single();
        if (insertError) throw insertError;
        return inserted!.id as string;
      };

      let sort = 1;
      for (const parent of comprehensiveCategories) {
        const parentId = await upsert(parent.name, parent.group as any, null, sort++);
        if (parent.children?.length) {
          for (const child of parent.children) {
            await upsert(child.name, child.group as any, parentId, sort++);
          }
        }
      }

      toast.success('Comprehensive categories seeded successfully!', {
        description: 'Your category system now includes all parent categories with subcategories'
      });

      // Force a page refresh to show new categories
      setTimeout(() => {
        window.location.reload();
      }, 1000);

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
      
      // Should have at least 12 parent categories from the refined master list
      const hasComprehensiveStructure = parentCategories.length >= 12;
      
      // Check for key missing categories (must-haves)
      const categoryNames = parentCategories.map(c => c.name.toLowerCase());
      const essentialParents = [
        'housing & utilities',
        'caregiving & medical', 
        'groceries & household supplies',
        'transportation',
        'insurance & financial',
        'entertainment & leisure',
        'core savings'
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