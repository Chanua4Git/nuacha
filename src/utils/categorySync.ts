import { supabase } from '@/integrations/supabase/client';

export type BudgetGroup = 'needs' | 'wants' | 'savings';

type CategorySeed = {
  name: string;
  color?: string;
  group?: BudgetGroup; // Preferred budget group for mapping
  children?: CategorySeed[];
};

// Recommended hierarchical categories tailored to the scenarios described
const recommendedCategorySeeds: CategorySeed[] = [
  {
    name: 'Housing',
    group: 'needs',
    children: [
      { name: 'Rent / Mortgage', group: 'needs' },
      { name: 'Home Insurance', group: 'needs' },
      { name: 'Utilities', group: 'needs', children: [
        { name: 'Electricity', group: 'needs' },
        { name: 'Water', group: 'needs' },
        { name: 'Gas', group: 'needs' },
        { name: 'Internet', group: 'needs' },
        { name: 'Phone', group: 'needs' },
      ]},
      { name: 'Maintenance & Repairs', group: 'needs' },
      { name: 'Yard & Garden', group: 'needs' },
      { name: 'Pest Control', group: 'needs' },
    ],
  },
  {
    name: 'Transportation',
    group: 'needs',
    children: [
      { name: 'Fuel / Gas', group: 'needs' },
      { name: 'Vehicle Insurance', group: 'needs' },
      { name: 'Maintenance & Service', group: 'needs' },
      { name: 'Registration & Inspection', group: 'needs' },
      { name: 'Parking & Tolls', group: 'needs' },
      { name: 'Public Transport', group: 'needs' },
    ],
  },
  {
    name: 'Food & Household',
    group: 'needs',
    children: [
      { name: 'Groceries', group: 'needs' },
      { name: 'Market', group: 'needs' },
      { name: 'Toiletries', group: 'needs' },
      { name: 'Household Supplies', group: 'needs' },
    ],
  },
  {
    name: 'Health & Care',
    group: 'needs',
    children: [
      { name: 'Nurses', group: 'needs', children: [
        { name: 'Night Nurse', group: 'needs' },
        { name: 'Day Nurse', group: 'needs' },
        { name: 'Weekend Nurse', group: 'needs' },
      ]},
      { name: 'Doctor', group: 'needs' },
      { name: 'Dental', group: 'needs' },
      { name: 'Optical', group: 'needs' },
      { name: 'Medications', group: 'needs' },
    ],
  },
  {
    name: 'Child',
    group: 'needs',
    children: [
      { name: 'School', group: 'needs', children: [
        { name: 'Fees', group: 'needs' },
        { name: 'Uniform', group: 'needs' },
        { name: 'Books & Supplies', group: 'needs' },
        { name: 'Transport', group: 'needs' },
        { name: 'Lunch Money', group: 'needs' },
        { name: 'Extra Tuition', group: 'needs' },
      ]},
      { name: 'Childcare', group: 'needs' },
      { name: 'Activities & Well-being', group: 'wants', children: [
        { name: 'Sports', group: 'wants' },
        { name: 'Toys & Games', group: 'wants' },
        { name: 'Outings', group: 'wants' },
        { name: 'Holidays', group: 'wants' },
      ]},
      { name: 'Hairdressing', group: 'wants' },
      { name: 'Gifts & Celebrations', group: 'wants' },
    ],
  },
  {
    name: 'Personal & Lifestyle',
    group: 'wants',
    children: [
      { name: 'Dining Out', group: 'wants' },
      { name: 'Entertainment', group: 'wants' },
      { name: 'Subscriptions', group: 'wants' },
      { name: 'Personal Care', group: 'wants' },
      { name: 'Gifts & Celebrations', group: 'wants' },
      { name: 'Travel & Holidays', group: 'wants' },
    ],
  },
  {
    name: 'Financial Goals',
    group: 'savings',
    children: [
      { name: 'Emergency Fund', group: 'savings' },
      { name: 'Investments', group: 'savings' },
      { name: 'Retirement', group: 'savings' },
      { name: 'Extra Debt Payments', group: 'savings' },
    ],
  },
];

function determineGroupFromName(name: string): BudgetGroup {
  const n = name.toLowerCase();
  if (
    /nurse|doctor|dental|optical|medication|medicine|insurance|mortgage|rent|utility|electric|water|gas|internet|phone|grocery|market|toiletr|school|fees|uniform|book|supply|transport|tuition|childcare|fuel|vehicle|maintenance|registration|inspection|parking|public/.test(
      n
    )
  )
    return 'needs';
  if (/saving|investment|retire|debt|emergency/.test(n)) return 'savings';
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
