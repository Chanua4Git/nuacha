import { supabase } from '@/integrations/supabase/client';

// Initialize comprehensive categories for demo and unauthenticated users
export const initializeDemoCategories = async () => {
  // This function ensures demo mode has access to comprehensive categories
  // without requiring authentication
  const { comprehensiveCategories } = await import('@/data/comprehensiveCategories');
  return comprehensiveCategories;
};

// Enhanced auto-categorization with comprehensive keyword mapping
export const autoCategorizeExpense = (description: string, place: string, categories: any[]) => {
  const desc = description.toLowerCase();
  const placeName = place.toLowerCase();
  
  // Personal Care & Hygiene
  if (desc.includes('toothpaste') || desc.includes('toothbrush') || desc.includes('deodorant') ||
      desc.includes('shampoo') || desc.includes('conditioner') || desc.includes('soap') ||
      desc.includes('toilet paper') || desc.includes('feminine') || desc.includes('pads') ||
      desc.includes('tampons') || desc.includes('razor') || desc.includes('body wash') ||
      desc.includes('lotion') || desc.includes('moisturizer') || desc.includes('sunscreen') ||
      desc.includes('makeup') || desc.includes('cosmetic') || desc.includes('lipstick') ||
      desc.includes('foundation') || desc.includes('mascara') || desc.includes('skincare')) {
    return categories.find(c => 
      c.id === 'personal-hygiene' || c.id === 'toiletries' || 
      c.id === 'skincare' || c.id === 'makeup-cosmetics' ||
      c.name?.toLowerCase().includes('personal care') ||
      c.name?.toLowerCase().includes('toiletries')
    )?.id;
  }

  // Clothing & Fashion
  if (desc.includes('shirt') || desc.includes('pants') || desc.includes('dress') ||
      desc.includes('shoes') || desc.includes('socks') || desc.includes('underwear') ||
      desc.includes('jacket') || desc.includes('coat') || desc.includes('jeans') ||
      desc.includes('sweater') || desc.includes('blouse') || desc.includes('skirt') ||
      desc.includes('boots') || desc.includes('sandals') || desc.includes('sneakers') ||
      desc.includes('clothing') || desc.includes('apparel') || desc.includes('fashion')) {
    return categories.find(c => 
      c.id === 'everyday-clothing' || c.id === 'shoes-footwear' || 
      c.id === 'undergarments-socks' || c.id === 'clothing-fashion' ||
      c.name?.toLowerCase().includes('clothing')
    )?.id;
  }

  // Technology & Electronics
  if (desc.includes('phone') || desc.includes('computer') || desc.includes('laptop') ||
      desc.includes('tablet') || desc.includes('software') || desc.includes('app') ||
      desc.includes('electronics') || desc.includes('gadget') || desc.includes('charger') ||
      desc.includes('headphones') || desc.includes('speaker') || desc.includes('camera') ||
      desc.includes('gaming') || desc.includes('console') || desc.includes('tv') ||
      placeName.includes('best buy') || placeName.includes('apple') || placeName.includes('microsoft')) {
    return categories.find(c => 
      c.id === 'mobile-phone' || c.id === 'computer-laptop' || 
      c.id === 'electronics-gadgets' || c.id === 'technology-electronics' ||
      c.name?.toLowerCase().includes('technology')
    )?.id;
  }

  // Household & Cleaning Supplies
  if (desc.includes('detergent') || desc.includes('bleach') || desc.includes('dishwasher') ||
      desc.includes('paper towel') || desc.includes('tissue') || desc.includes('cleaning') ||
      desc.includes('vacuum') || desc.includes('mop') || desc.includes('sponge') ||
      desc.includes('disinfectant') || desc.includes('laundry') || desc.includes('fabric softener') ||
      desc.includes('kitchen') || desc.includes('bathroom') || desc.includes('household')) {
    return categories.find(c => 
      c.id === 'cleaning-supplies' || c.id === 'kitchen-supplies' || 
      c.id === 'bathroom-supplies' || c.id === 'paper-goods' ||
      c.name?.toLowerCase().includes('household') ||
      c.name?.toLowerCase().includes('cleaning')
    )?.id;
  }

  // Childcare & Education
  if (desc.includes('childcare') || desc.includes('babysitting') || desc.includes('daycare') || 
      desc.includes('child care') || desc.includes('nanny') || desc.includes('school') || 
      desc.includes('education') || desc.includes('tuition') || desc.includes('uniform') || 
      desc.includes('books') || desc.includes('stationery') || desc.includes('backpack') ||
      desc.includes('lunch box') || desc.includes('school supplies')) {
    return categories.find(c => 
      c.id === 'childcare' || c.id === 'school-fees' || 
      c.id === 'books-stationery' || c.id === 'school-uniforms' ||
      c.name?.toLowerCase().includes('childcare') ||
      c.name?.toLowerCase().includes('education') ||
      c.name?.toLowerCase().includes('school')
    )?.id;
  }
  
  // Groceries & Food
  if (desc.includes('grocery') || desc.includes('food') || desc.includes('supermarket') ||
      desc.includes('produce') || desc.includes('meat') || desc.includes('dairy') ||
      desc.includes('bread') || desc.includes('milk') || desc.includes('eggs') ||
      desc.includes('fruit') || desc.includes('vegetable') || desc.includes('snack') ||
      placeName.includes('market') || placeName.includes('grocery') || placeName.includes('food') ||
      placeName.includes('walmart') || placeName.includes('target') || placeName.includes('kroger') ||
      placeName.includes('safeway') || placeName.includes('costco') || placeName.includes('whole foods')) {
    return categories.find(c => 
      c.id === 'groceries' || c.id === 'fresh-produce' || 
      c.id === 'meat-seafood' || c.id === 'dairy-eggs' ||
      c.name?.toLowerCase().includes('groceries')
    )?.id;
  }
  
  // Transportation & Fuel
  if (desc.includes('gas') || desc.includes('fuel') || desc.includes('transport') ||
      desc.includes('taxi') || desc.includes('uber') || desc.includes('lyft') ||
      desc.includes('bus') || desc.includes('train') || desc.includes('parking') ||
      desc.includes('toll') || desc.includes('car wash') || desc.includes('oil change') ||
      placeName.includes('gas') || placeName.includes('station') || placeName.includes('shell') ||
      placeName.includes('bp') || placeName.includes('exxon') || placeName.includes('chevron')) {
    return categories.find(c => 
      c.id === 'fuel' || c.id === 'taxi-rideshare' || 
      c.id === 'public-transportation' || c.id === 'vehicle-maintenance' ||
      c.name?.toLowerCase().includes('fuel') ||
      c.name?.toLowerCase().includes('transportation')
    )?.id;
  }
  
  // Dining Out & Restaurants
  if (desc.includes('restaurant') || desc.includes('dining') || desc.includes('cafe') ||
      desc.includes('coffee') || desc.includes('pizza') || desc.includes('burger') ||
      desc.includes('takeout') || desc.includes('delivery') || desc.includes('fast food') ||
      placeName.includes('restaurant') || placeName.includes('cafe') || placeName.includes('dine') ||
      placeName.includes('mcdonald') || placeName.includes('subway') || placeName.includes('starbucks') ||
      placeName.includes('pizza') || placeName.includes('burger')) {
    return categories.find(c => 
      c.id === 'dining-out' || c.name?.toLowerCase().includes('dining')
    )?.id;
  }
  
  // Medical & Healthcare
  if (desc.includes('doctor') || desc.includes('medical') || desc.includes('hospital') ||
      desc.includes('clinic') || desc.includes('pharmacy') || desc.includes('prescription') ||
      desc.includes('medicine') || desc.includes('dentist') || desc.includes('dental') ||
      desc.includes('vision') || desc.includes('eye') || desc.includes('health') ||
      placeName.includes('cvs') || placeName.includes('walgreens') || placeName.includes('pharmacy') ||
      placeName.includes('hospital') || placeName.includes('clinic')) {
    return categories.find(c => 
      c.id === 'doctor-visits' || c.id === 'medication' || 
      c.id === 'medical-supplies' || c.id === 'child-medical' ||
      c.name?.toLowerCase().includes('medical') ||
      c.name?.toLowerCase().includes('doctor') ||
      c.name?.toLowerCase().includes('health')
    )?.id;
  }

  // Utilities & Bills
  if (desc.includes('electric') || desc.includes('water') || desc.includes('gas bill') ||
      desc.includes('internet') || desc.includes('phone bill') || desc.includes('cable') ||
      desc.includes('utility') || desc.includes('bill') || desc.includes('payment') ||
      placeName.includes('utility') || placeName.includes('electric') || placeName.includes('water')) {
    return categories.find(c => 
      c.id === 'electricity' || c.id === 'water-sewer' || 
      c.id === 'gas' || c.id === 'internet-wifi' ||
      c.name?.toLowerCase().includes('utilities')
    )?.id;
  }

  // Entertainment & Leisure
  if (desc.includes('movie') || desc.includes('game') || desc.includes('toy') ||
      desc.includes('book') || desc.includes('entertainment') || desc.includes('hobby') ||
      desc.includes('sport') || desc.includes('gym') || desc.includes('fitness') ||
      desc.includes('subscription') || desc.includes('streaming') || desc.includes('netflix') ||
      desc.includes('spotify') || desc.includes('concert') || desc.includes('event')) {
    return categories.find(c => 
      c.id === 'events-tickets' || c.id === 'hobbies-crafts' || 
      c.id === 'subscriptions' || c.id === 'gym-membership' ||
      c.name?.toLowerCase().includes('entertainment') ||
      c.name?.toLowerCase().includes('leisure')
    )?.id;
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