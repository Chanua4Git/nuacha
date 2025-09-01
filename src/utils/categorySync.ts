import { supabase } from '@/integrations/supabase/client';
import { comprehensiveCategories } from '@/data/comprehensiveCategories';

export type BudgetGroup = 'needs' | 'wants' | 'savings';

type CategorySeed = {
  name: string;
  color?: string;
  group?: BudgetGroup; // Preferred budget group for mapping
  children?: CategorySeed[];
};

// Comprehensive category structure aligned with budget categories
// Build seeds directly from the comprehensive demo categories to keep site-wide consistency
const mapToSeeds = (items: any[]): CategorySeed[] =>
  items.map((c: any) => ({
    name: c.name,
    group: (c.group || 'needs') as BudgetGroup,
    children: c.children ? mapToSeeds(c.children) : undefined,
  }));

const recommendedCategorySeeds: CategorySeed[] = mapToSeeds(comprehensiveCategories);


function determineGroupFromName(name: string): BudgetGroup {
  const n = name.toLowerCase();

  const needsKeywords = [
    'rent', 'mortgage', 'property tax', 'hoa', 'maintenance fees', 'electricity', 'water', 'sewer',
    'gas', 'garbage', 'internet', 'wi-fi', 'wifi', 'mobile', 'home phone', 'day nurse', 'night nurse',
    'weekday nurse', 'weekend day nurse', 'elderly care', 'doctor', 'specialist', 'mental health',
    'counseling', 'dental', 'orthodontic', 'vision', 'glasses', 'contacts', 'medication', 'medical supplies',
    'tests', 'diagnostics', 'emergency care', 'ambulance', 'childcare', 'tuition', 'school fees',
    'books', 'stationery', 'uniforms', 'school lunches', 'meal programs', 'bus fees', 'exam', 'device',
    'technology fees', 'tutoring & homework help', 'iep', 'camps during school breaks', 'child food',
    'child toiletries', 'co-pays', 'groceries', 'special dietary', 'paper goods', 'toiletries', 'diapers',
    'feminine care', 'cleaning supplies', 'water delivery', 'cleaning & housekeeping', 'laundry',
    'household repairs', 'appliance repairs', 'garden services', 'pool maintenance', 'pest control',
    'domestic employee payroll', 'fuel', 'public transportation', 'taxi', 'rideshare', 'vehicle insurance',
    'vehicle loan', 'vehicle maintenance', 'registration', 'inspection', 'parking', 'tolls', 'roadside assistance',
    "driver's license", 'health insurance', 'dental insurance', 'life insurance', 'home insurance',
    'other insurance', 'loan repayments', 'student loan', 'minimum debt', 'extra debt', 'child support',
    'pet food', 'vet', 'pet medications', 'grooming', 'boarding', 'bank fees', 'legal fees', 'emergency expenses',
    'postage', 'shipping', 'po box'
  ];

  const savingsKeywords = [
    'emergency fund', 'sinking fund', 'home maintenance & appliance replacement', 'vehicle maintenance & replacement',
    'medical / dental out-of-pocket', 'education costs', 'gifts & holidays', 'travel fund', 'pet care fund',
    'retirement', 'education savings', 'investments', 'unit trust', 'mutual fund', 'insurance deductibles reserve',
    'savings', 'investment'
  ];

  if (needsKeywords.some(k => n.includes(k))) return 'needs';
  if (savingsKeywords.some(k => n.includes(k))) return 'savings';
  return 'wants';
}

async function getOrCreateCategory(
  familyId: string,
  name: string,
  parentId: string | null
): Promise<string> {
  try {
    // Check for existing category by name + parent within family
    let query = supabase
      .from('categories')
      .select('id')
      .eq('family_id', familyId)
      .eq('name', name);

    if (parentId === null) {
      query = query.filter('parent_id', 'is', null);
    } else {
      query = query.eq('parent_id', parentId);
    }

    const { data: existing, error: selectError } = await query.limit(1).maybeSingle();
    if (selectError) throw selectError;

    if (existing?.id) return existing.id as string;

    const { data: inserted, error: insertError } = await supabase
      .from('categories')
      .insert({
        family_id: familyId,
        name,
        color: '#5A7684',
        parent_id: parentId,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting category:', insertError);
      throw insertError;
    }
    return inserted!.id as string;
  } catch (error) {
    console.error('Error in getOrCreateCategory:', error);
    throw error;
  }
}

async function seedTree(
  familyId: string,
  seeds: CategorySeed[],
  parentId: string | null = null
): Promise<void> {
  for (const seed of seeds) {
    const id = await getOrCreateCategory(familyId, seed.name, parentId);
    if (seed.children?.length) {
      await seedTree(familyId, seed.children, id);
    }
  }
}

export async function seedRecommendedExpenseCategories(familyId: string) {
  try {
    // Verify family exists and user has access by checking family ownership
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id, user_id')
      .eq('id', familyId)
      .single();
    
    if (familyError) {
      console.error('Family verification failed:', familyError);
      throw new Error('Unable to verify family ownership');
    }
    
    if (!family) {
      throw new Error('Family not found');
    }
    
    await seedTree(familyId, recommendedCategorySeeds);
  } catch (error) {
    console.error('Error seeding categories for family:', familyId, error);
    throw error;
  }
}

export async function ensureBudgetDefaults(userId: string) {
  // If user has no budget categories, initialize defaults using the safer version
  const { data: existing, error } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .is('is_budget_category', true)
    .is('family_id', null)
    .limit(1);
  if (error) throw error;

  if (!existing || existing.length === 0) {
    await supabase.rpc('ensure_user_budget_categories_safe', { user_uuid: userId });
  }
}

export async function ensureBudgetCategory(
  userId: string,
  name: string,
  group: BudgetGroup,
  sortOrder = 100
): Promise<string> {
  // Enhanced duplicate check - look for existing by name and user, regardless of group initially
  const { data: existing, error: selectError } = await supabase
    .from('categories')
    .select('id, group_type')
    .eq('user_id', userId)
    .eq('name', name)
    .is('is_budget_category', true)
    .is('family_id', null) // Only user-level budget categories
    .limit(1);
  if (selectError) throw selectError;
  
  if (existing && existing.length > 0) {
    const category = existing[0];
    // If group type differs, update it
    if (category.group_type !== group) {
      await supabase
        .from('categories')
        .update({ group_type: group })
        .eq('id', category.id);
    }
    return category.id as string;
  }

  // No existing category found, create new one
  const { data: inserted, error: insertError } = await supabase
    .from('categories')
    .insert({ 
      user_id: userId, 
      name, 
      group_type: group, 
      sort_order: sortOrder,
      is_budget_category: true,
      family_id: null, // Explicitly set for user-level budget categories
      color: group === 'needs' ? '#EF4444' : group === 'savings' ? '#22C55E' : '#F97316'
    })
    .select('id')
    .single();
  if (insertError) {
    // Handle potential race condition - try to find existing again
    if (insertError.code === '23505') { // Unique violation
      const { data: raceCheck } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', name)
        .is('is_budget_category', true)
        .is('family_id', null)
        .limit(1);
      if (raceCheck && raceCheck.length > 0) {
        return raceCheck[0].id as string;
      }
    }
    throw insertError;
  }
  return inserted!.id as string;
}

export async function syncExpenseToBudgetCategories(
  userId: string,
  familyId: string
) {
  try {
    await ensureBudgetDefaults(userId);

    // Verify family ownership before syncing
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id, user_id')
      .eq('id', familyId)
      .eq('user_id', userId)
      .single();
    
    if (familyError || !family) {
      console.error('Family ownership verification failed:', familyError);
      throw new Error('You do not have permission to sync categories for this family');
    }

    // Fetch all categories for the family
    const { data: cats, error } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('family_id', familyId);
    if (error) throw error;

    // Build a set of unique top-level and important subcategory names
    const uniqueNames = new Set<string>();
    cats?.forEach((c) => uniqueNames.add(c.name));

    // Also include all seed names to guarantee presence
    const collectSeedNames = (seeds: CategorySeed[]) => {
      for (const s of seeds) {
        uniqueNames.add(s.name);
        if (s.children) collectSeedNames(s.children);
      }
    };
    collectSeedNames(recommendedCategorySeeds);

    // Create missing budget categories with group inference
    let sort = 50;
    for (const name of uniqueNames) {
      const group = determineGroupFromName(name);
      await ensureBudgetCategory(userId, name, group, sort++);
    }
  } catch (error) {
    console.error('Error syncing expense to budget categories:', error);
    throw error;
  }
}
