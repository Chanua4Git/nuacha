
import { supabase } from '@/integrations/supabase/client';

export type BudgetGroup = 'needs' | 'wants' | 'savings';

type CategorySeed = {
  name: string;
  color?: string;
  group?: BudgetGroup;
  children?: CategorySeed[];
};

// Comprehensive category structure aligned with budget categories
const recommendedCategorySeeds: CategorySeed[] = [
  {
    name: 'Housing & Utilities',
    group: 'needs',
    children: [
      { name: 'Rent / Mortgage', group: 'needs' },
      { name: 'Electricity', group: 'needs' },
      { name: 'Water & Sewer', group: 'needs' },
      { name: 'Gas', group: 'needs' },
      { name: 'Internet / Wi-Fi', group: 'needs' },
      { name: 'Mobile Phone Service', group: 'needs' },
      { name: 'Home Phone Service', group: 'needs' },
      { name: 'Cable / Streaming services', group: 'wants' },
      { name: 'Garbage collection', group: 'needs' },
    ],
  },
  {
    name: 'Caregiving & Medical',
    group: 'needs',
    children: [
      { name: 'Day nurse', group: 'needs' },
      { name: 'Night nurse', group: 'needs' },
      { name: 'Doctor visits', group: 'needs' },
      { name: 'Specialist visits', group: 'needs' },
      { name: 'Medical tests', group: 'needs' },
      { name: 'Medication', group: 'needs' },
      { name: 'Medical supplies', group: 'needs' },
      { name: 'Elderly Care / Support', group: 'needs' },
    ],
  },
  {
    name: 'Household Operations',
    group: 'needs',
    children: [
      { name: 'Housekeeper', group: 'wants' },
      { name: 'Garden services', group: 'wants' },
      { name: 'Pool maintenance', group: 'wants' },
      { name: 'Pest control', group: 'needs' },
      { name: 'Laundry', group: 'needs' },
      { name: 'Household repairs', group: 'needs' },
      { name: 'Appliance repairs', group: 'needs' },
    ],
  },
  {
    name: 'Groceries & Household Supplies',
    group: 'needs',
    children: [
      { name: 'Groceries', group: 'needs' },
      { name: 'Special Dietary Needs (Formula, Baby Food)', group: 'needs' },
      { name: 'Pet food & supplies', group: 'needs' },
      { name: 'Toiletries', group: 'needs' },
      { name: 'Paper goods', group: 'needs' },
    ],
  },
  {
    name: 'Transportation',
    group: 'needs',
    children: [
      { name: 'Fuel', group: 'needs' },
      { name: 'Taxi / rideshare', group: 'needs' },
      { name: 'Public transportation', group: 'needs' },
      { name: 'Vehicle maintenance', group: 'needs' },
      { name: 'Vehicle insurance', group: 'needs' },
      { name: 'Vehicle loan payment', group: 'needs' },
    ],
  },
  {
    name: 'Insurance & Financial',
    group: 'needs',
    children: [
      { name: 'Health insurance', group: 'needs' },
      { name: 'Dental insurance', group: 'needs' },
      { name: 'Life insurance', group: 'needs' },
      { name: 'Home insurance', group: 'needs' },
      { name: 'Other insurance', group: 'needs' },
      { name: 'Loan repayments', group: 'needs' },
      { name: 'Student loan payments', group: 'needs' },
      { name: 'Property taxes', group: 'needs' },
      { name: 'Savings', group: 'savings' },
      { name: 'Investments', group: 'savings' },
    ],
  },
  {
    name: 'Personal Care & Wellness',
    group: 'wants',
    children: [
      { name: 'Vision care (glasses, contacts, exams)', group: 'needs' },
      { name: 'Haircuts & grooming', group: 'wants' },
      { name: 'Spa & massage', group: 'wants' },
      { name: 'Gym membership', group: 'wants' },
      { name: 'Vitamins & supplements', group: 'wants' },
    ],
  },
  {
    name: 'Education & Child Expenses',
    group: 'needs',
    children: [
      { name: 'School fees', group: 'needs' },
      { name: 'School lunches / meal programs', group: 'needs' },
      { name: 'School transportation (bus fees)', group: 'needs' },
      { name: 'Books & stationery', group: 'needs' },
      { name: 'Extracurricular activities', group: 'wants' },
      { name: 'School uniforms', group: 'needs' },
      { name: 'Childcare', group: 'needs' },
    ],
  },
  {
    name: 'Entertainment & Leisure',
    group: 'wants',
    children: [
      { name: 'Dining out', group: 'wants' },
      { name: 'Subscriptions', group: 'wants' },
      { name: 'Events & tickets', group: 'wants' },
      { name: 'Hobbies & crafts', group: 'wants' },
    ],
  },
  {
    name: 'Gifts & Special Occasions',
    group: 'wants',
    children: [
      { name: 'Birthday gifts', group: 'wants' },
      { name: 'Holiday gifts', group: 'wants' },
      { name: 'Anniversaries', group: 'wants' },
      { name: 'Weddings & celebrations', group: 'wants' },
    ],
  },
  {
    name: 'Travel & Holidays',
    group: 'wants',
    children: [
      { name: 'Flights & transportation', group: 'wants' },
      { name: 'Accommodation', group: 'wants' },
      { name: 'Travel insurance', group: 'wants' },
      { name: 'Activities & tours', group: 'wants' },
    ],
  },
  {
    name: 'Miscellaneous',
    group: 'needs',
    children: [
      { name: 'Emergency expenses', group: 'needs' },
      { name: 'Donations & charity', group: 'wants' },
      { name: 'Legal fees', group: 'needs' },
      { name: 'Bank fees', group: 'needs' },
      { name: 'Unplanned purchases', group: 'wants' },
    ],
  },
];

function determineGroupFromName(name: string): BudgetGroup {
  const n = name.toLowerCase();
  
  if (
    /rent|mortgage|electricity|water|sewer|gas|internet|wifi|phone|mobile|garbage|day nurse|night nurse|doctor|specialist|medical|medication|medicine|pest control|laundry|household repairs|appliance repairs|groceries|pet food|toiletries|paper goods|fuel|taxi|rideshare|public transportation|vehicle maintenance|vehicle insurance|vehicle loan|health insurance|dental insurance|life insurance|home insurance|loan repayments|student loan|property tax|emergency|legal fees|bank fees|school fees|school lunch|school transport|books|stationery|school uniforms|childcare|vision care|glasses|contacts|elderly care|special dietary|formula|baby food/.test(n)
  ) {
    return 'needs';
  }
  
  if (/saving|investment|retire|debt/.test(n)) {
    return 'savings';
  }
  
  return 'wants';
}

// Case-insensitive check for existing categories
async function getOrCreateCategory(
  familyId: string,
  name: string,
  parentId: string | null
): Promise<string> {
  try {
    // Check for existing category by name + parent within family (case-insensitive)
    let query = supabase
      .from('categories')
      .select('id')
      .eq('family_id', familyId)
      .ilike('name', name); // Use ilike for case-insensitive match

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

// Case-insensitive budget category creation with enhanced duplicate checking
export async function ensureBudgetCategory(
  userId: string,
  name: string,
  group: BudgetGroup,
  sortOrder = 100
): Promise<string> {
  // Case-insensitive duplicate check
  const { data: existing, error: selectError } = await supabase
    .from('categories')
    .select('id, group_type')
    .eq('user_id', userId)
    .ilike('name', name) // Case-insensitive search
    .is('is_budget_category', true)
    .is('family_id', null)
    .limit(1);
  if (selectError) throw selectError;
  
  if (existing && existing.length > 0) {
    const category = existing[0];
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
      family_id: null,
      color: group === 'needs' ? '#EF4444' : group === 'savings' ? '#22C55E' : '#F97316'
    })
    .select('id')
    .single();
  if (insertError) {
    if (insertError.code === '23505') { // Unique violation - race condition
      const { data: raceCheck } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', name)
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

    const { data: cats, error } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('family_id', familyId);
    if (error) throw error;

    const uniqueNames = new Set<string>();
    cats?.forEach((c) => uniqueNames.add(c.name));

    const collectSeedNames = (seeds: CategorySeed[]) => {
      for (const s of seeds) {
        uniqueNames.add(s.name);
        if (s.children) collectSeedNames(s.children);
      }
    };
    collectSeedNames(recommendedCategorySeeds);

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
