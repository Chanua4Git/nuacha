export interface UnpaidLaborCategory {
  id: string;
  name: string;
  description: string;
  defaultValue: number;
  familyTypes: string[];
  relatedExpenseCategory?: string;
}

export const unpaidLaborCategories: UnpaidLaborCategory[] = [
  {
    id: 'meal-management',
    name: 'Meal Management',
    description: 'Cooking, meal planning, kitchen cleanup',
    defaultValue: 2400,
    familyTypes: ['single-mother', 'two-parent', 'multi-generational'],
    relatedExpenseCategory: 'Groceries'
  },
  {
    id: 'childcare-coordination',
    name: 'Care Coordination',
    description: 'Childcare (nanny/daycare/babysitting/after-school)',
    defaultValue: 5000,
    familyTypes: ['single-mother', 'two-parent'],
    relatedExpenseCategory: 'Childcare'
  },
  {
    id: 'administrative-work',
    name: 'Household Admin',
    description: 'Scheduling repairs, bills, budgeting, supervising workers, making appointments',
    defaultValue: 800,
    familyTypes: ['single-mother', 'two-parent', 'elderly-care', 'multi-generational'],
    relatedExpenseCategory: 'Administrative services'
  },
  {
    id: 'transportation-services',
    name: 'School Transportation',
    description: 'School transportation (bus fees)',
    defaultValue: 800,
    familyTypes: ['single-mother', 'two-parent'],
    relatedExpenseCategory: 'Public transportation'
  },
  {
    id: 'educational-support',
    name: 'Tutoring & Homework Help',
    description: 'Reading, writing, test prep (SCA, CSEC)',
    defaultValue: 1600,
    familyTypes: ['single-mother', 'two-parent'],
    relatedExpenseCategory: 'Extracurricular activities'
  },
  {
    id: 'emotional-mental-load',
    name: 'Emotional Support / Mental Load',
    description: 'Being a sounding board, nurturing relationships, managing invisible labor',
    defaultValue: 1000,
    familyTypes: ['single-mother', 'two-parent', 'elderly-care', 'multi-generational'],
    relatedExpenseCategory: 'Mental health services'
  },
  {
    id: 'event-coordination',
    name: 'Event Coordination',
    description: 'Planning celebrations, managing family events',
    defaultValue: 400,
    familyTypes: ['single-mother', 'two-parent', 'multi-generational'],
    relatedExpenseCategory: 'Events & tickets'
  },
  {
    id: 'shopping-errands',
    name: 'Shopping & Errands',
    description: 'Grocery shopping, pharmacy, post office',
    defaultValue: 800,
    familyTypes: ['single-mother', 'two-parent', 'elderly-care', 'multi-generational'],
    relatedExpenseCategory: 'Groceries'
  },
  {
    id: 'cleaning-housekeeping',
    name: 'Cleaning & Housekeeping',
    description: 'Cleaning & Housekeeping (routine)',
    defaultValue: 1200,
    familyTypes: ['single-mother', 'two-parent', 'multi-generational'],
    relatedExpenseCategory: 'Housekeeper'
  },
  {
    id: 'laundry',
    name: 'Laundry',
    description: 'Laundry',
    defaultValue: 400,
    familyTypes: ['single-mother', 'two-parent', 'multi-generational'],
    relatedExpenseCategory: 'Laundry'
  },
  {
    id: 'pet-care',
    name: 'Pet Care',
    description: 'Pet food & supplies / Vet visits & vaccinations',
    defaultValue: 650,
    familyTypes: ['single-mother', 'two-parent', 'multi-generational'],
    relatedExpenseCategory: 'Pet food & supplies'
  },
  {
    id: 'deep-cleaning',
    name: 'Deep Cleaning',
    description: 'Deep cleaning / one-off cleans',
    defaultValue: 500,
    familyTypes: ['single-mother', 'two-parent', 'multi-generational'],
    relatedExpenseCategory: 'Housekeeper'
  },
  {
    id: 'elderly-care-coordination',
    name: 'Elderly Care Coordination',
    description: 'Medical coordination, mobility assistance, daily care',
    defaultValue: 3000,
    familyTypes: ['elderly-care', 'multi-generational'],
    relatedExpenseCategory: 'Elderly Care / Support'
  }
];

export const getUnpaidLaborForFamilyType = (familyType: string): UnpaidLaborCategory[] => {
  return unpaidLaborCategories.filter(category => 
    category.familyTypes.includes(familyType)
  );
};

export const getTotalUnpaidLaborValue = (familyType: string): number => {
  return getUnpaidLaborForFamilyType(familyType)
    .reduce((sum, category) => sum + category.defaultValue, 0);
};