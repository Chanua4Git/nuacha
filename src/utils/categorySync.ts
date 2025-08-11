import { supabase } from '@/integrations/supabase/client';

export type BudgetGroup = 'needs' | 'wants' | 'savings';

type CategorySeed = {
  name: string;
  color?: string;
  group?: BudgetGroup; // Preferred budget group for mapping
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
      { name: 'Life insurance', group: 'needs' },
      { name: 'Home insurance', group: 'needs' },
      { name: 'Other insurance', group: 'needs' },
      { name: 'Loan repayments', group: 'needs' },
      { name: 'Savings', group: 'savings' },
      { name: 'Investments', group: 'savings' },
    ],
  },
  {
    name: 'Personal Care & Wellness',
    group: 'wants',
    children: [
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
  
  // Needs categories (Essential expenses)
  if (
    /rent|mortgage|electricity|water|sewer|gas|internet|wifi|garbage|day nurse|night nurse|doctor|specialist|medical|medication|medicine|pest control|laundry|household repairs|appliance repairs|groceries|pet food|toiletries|paper goods|fuel|taxi|rideshare|public transportation|vehicle maintenance|vehicle insurance|vehicle loan|health insurance|life insurance|home insurance|loan repayments|emergency|legal fees|bank fees|school fees|books|stationery|school uniforms|childcare/.test(n)
  ) {
    return 'needs';
  }
  
  // Savings categories
  if (/saving|investment|retire|debt/.test(n)) {
    return 'savings';
  }
  
  // Wants categories (Lifestyle expenses) - everything else defaults here
  return 'wants';
}

async function getOrCreateCategory(
  familyId: string,
  name: string,
  parentId: string | null
): Promise<string> {
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

  if (insertError) throw insertError;
  return inserted!.id as string;
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
  await seedTree(familyId, recommendedCategorySeeds);
}

export async function ensureBudgetDefaults(userId: string) {
  // If user has no budget categories, initialize defaults via RPC
  const { data: existing, error } = await supabase
    .from('budget_categories')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  if (error) throw error;

  if (!existing || existing.length === 0) {
    await supabase.rpc('create_default_budget_categories', { user_uuid: userId });
  }
}

export async function ensureBudgetCategory(
  userId: string,
  name: string,
  group: BudgetGroup,
  sortOrder = 100
) {
  const { data: existing, error: selectError } = await supabase
    .from('budget_categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .eq('group_type', group)
    .limit(1);
  if (selectError) throw selectError;
  if (existing && existing.length > 0) return existing[0].id;

  const { data: inserted, error: insertError } = await supabase
    .from('budget_categories')
    .insert({ user_id: userId, name, group_type: group, sort_order: sortOrder })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return inserted!.id as string;
}

export async function syncExpenseToBudgetCategories(
  userId: string,
  familyId: string
) {
  await ensureBudgetDefaults(userId);

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
}
