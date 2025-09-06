export interface UnpaidLaborCategory {
  id: string;
  name: string;
  description: string;
  defaultValue: number;
  familyTypes: string[];
}

export const unpaidLaborCategories: UnpaidLaborCategory[] = [
  {
    id: 'meal-management',
    name: 'Meal Management',
    description: 'Cooking, meal planning, kitchen cleanup',
    defaultValue: 2400,
    familyTypes: ['single-mother', 'two-parent', 'multi-generational']
  },
  {
    id: 'childcare-coordination',
    name: 'Care Coordination',
    description: 'Childcare, bathing, feeding, emotional support',
    defaultValue: 5000,
    familyTypes: ['single-mother', 'two-parent']
  },
  {
    id: 'administrative-work',
    name: 'Administrative Work',
    description: 'Bills, scheduling, appointments, budgeting',
    defaultValue: 800,
    familyTypes: ['single-mother', 'two-parent', 'elderly-care', 'multi-generational']
  },
  {
    id: 'transportation-services',
    name: 'Transportation Services',
    description: 'School runs, errands, appointments',
    defaultValue: 800,
    familyTypes: ['single-mother', 'two-parent']
  },
  {
    id: 'educational-support',
    name: 'Educational Support',
    description: 'Homework help, tutoring, school communication',
    defaultValue: 1600,
    familyTypes: ['single-mother', 'two-parent']
  },
  {
    id: 'emotional-mental-load',
    name: 'Mental/Emotional Load',
    description: 'Planning, organizing, relationship management',
    defaultValue: 1000,
    familyTypes: ['single-mother', 'two-parent', 'elderly-care', 'multi-generational']
  },
  {
    id: 'event-coordination',
    name: 'Event Coordination',
    description: 'Planning celebrations, managing family events',
    defaultValue: 400,
    familyTypes: ['single-mother', 'two-parent', 'multi-generational']
  },
  {
    id: 'shopping-errands',
    name: 'Shopping & Errands',
    description: 'Grocery shopping, pharmacy, post office',
    defaultValue: 800,
    familyTypes: ['single-mother', 'two-parent', 'elderly-care', 'multi-generational']
  },
  {
    id: 'specialized-care',
    name: 'Specialized Care',
    description: 'Pet care, deep cleaning projects',
    defaultValue: 650,
    familyTypes: ['single-mother', 'two-parent', 'multi-generational']
  },
  {
    id: 'elderly-care-coordination',
    name: 'Elderly Care Coordination',
    description: 'Medical coordination, mobility assistance, daily care',
    defaultValue: 3000,
    familyTypes: ['elderly-care', 'multi-generational']
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