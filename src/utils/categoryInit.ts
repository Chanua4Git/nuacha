import { supabase } from '@/integrations/supabase/client';

// Initialize comprehensive categories for demo and unauthenticated users
export const initializeDemoCategories = async () => {
  // This function ensures demo mode has access to comprehensive categories
  // without requiring authentication
  const { comprehensiveCategories } = await import('@/data/comprehensiveCategories');
  return comprehensiveCategories;
};

// Auto-categorize expenses based on description and place
export const autoCategorizeExpense = (description: string, place: string, categories: any[]) => {
  const desc = description.toLowerCase();
  const placeName = place.toLowerCase();
  
  // Childcare keywords
  if (desc.includes('childcare') || desc.includes('babysitting') || desc.includes('daycare') || 
      desc.includes('child care') || desc.includes('nanny')) {
    return categories.find(c => c.name === 'Childcare / babysitting' || c.id === 'childcare')?.id;
  }
  
  // Education keywords
  if (desc.includes('school') || desc.includes('education') || desc.includes('tuition') ||
      desc.includes('uniform') || desc.includes('books') || desc.includes('stationery')) {
    return categories.find(c => c.name.includes('Education') || c.name.includes('School'))?.id;
  }
  
  // Groceries
  if (desc.includes('grocery') || desc.includes('food') || desc.includes('supermarket') ||
      placeName.includes('market') || placeName.includes('grocery') || placeName.includes('food')) {
    return categories.find(c => c.name === 'Groceries' || c.id === 'groceries')?.id;
  }
  
  // Transportation
  if (desc.includes('gas') || desc.includes('fuel') || desc.includes('transport') ||
      placeName.includes('gas') || placeName.includes('station') || placeName.includes('shell')) {
    return categories.find(c => c.name === 'Fuel' || c.id === 'fuel')?.id;
  }
  
  // Dining out
  if (desc.includes('restaurant') || desc.includes('dining') || desc.includes('cafe') ||
      placeName.includes('restaurant') || placeName.includes('cafe') || placeName.includes('dine')) {
    return categories.find(c => c.name === 'Dining out' || c.id === 'dining-out')?.id;
  }
  
  // Medical/Healthcare
  if (desc.includes('doctor') || desc.includes('medical') || desc.includes('hospital') ||
      desc.includes('clinic') || desc.includes('pharmacy')) {
    return categories.find(c => c.name.includes('Medical') || c.name.includes('Doctor'))?.id;
  }
  
  return null;
};

// Sync categories for existing users
export const syncUserCategories = async (userId: string) => {
  try {
    // Get user's families
    const { data: families } = await supabase
      .from('families')
      .select('id')
      .eq('user_id', userId);
    
    if (families && families.length > 0) {
      // Import the sync functions
      const { seedRecommendedExpenseCategories, syncExpenseToBudgetCategories, ensureBudgetDefaults } = 
        await import('@/utils/categorySync');
      
      // Ensure budget defaults
      await ensureBudgetDefaults(userId);
      
      // Sync categories for each family
      for (const family of families) {
        await seedRecommendedExpenseCategories(family.id);
        await syncExpenseToBudgetCategories(userId, family.id);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error syncing user categories:', error);
    return false;
  }
};