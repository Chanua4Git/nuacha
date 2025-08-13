// Comprehensive 12-category structure for demos and categorization
export interface DemoCategory {
  id: string;
  name: string;
  color: string;
  group: 'needs' | 'wants' | 'savings';
  children?: DemoCategory[];
}

export const comprehensiveCategories: DemoCategory[] = [
  // 1. Housing & Utilities (Needs)
  {
    id: 'housing-utilities',
    name: 'Housing & Utilities',
    color: '#0EA5E9',
    group: 'needs',
    children: [
      { id: 'rent-mortgage', name: 'Rent / Mortgage', color: '#0EA5E9', group: 'needs' },
      { id: 'electricity', name: 'Electricity', color: '#0EA5E9', group: 'needs' },
      { id: 'water-sewer', name: 'Water & Sewer', color: '#0EA5E9', group: 'needs' },
      { id: 'gas', name: 'Gas', color: '#0EA5E9', group: 'needs' },
      { id: 'internet-wifi', name: 'Internet / Wi-Fi', color: '#0EA5E9', group: 'needs' },
      { id: 'cable-streaming', name: 'Cable / Streaming services', color: '#0EA5E9', group: 'wants' },
      { id: 'garbage-collection', name: 'Garbage collection', color: '#0EA5E9', group: 'needs' }
    ]
  },

  // 2. Caregiving & Medical (Needs)
  {
    id: 'caregiving-medical',
    name: 'Caregiving & Medical',
    color: '#EF4444',
    group: 'needs',
    children: [
      { id: 'day-nurse', name: 'Day nurse', color: '#EF4444', group: 'needs' },
      { id: 'night-nurse', name: 'Night nurse', color: '#EF4444', group: 'needs' },
      { id: 'nurse', name: 'Nurse', color: '#EF4444', group: 'needs' },
      { id: 'weekday-nurse', name: 'WeekDay nurse', color: '#EF4444', group: 'needs' },
      { id: 'weekend-day-nurse', name: 'Weekend Day Nurse', color: '#EF4444', group: 'needs' },
      { id: 'doctor-visits', name: 'Doctor visits', color: '#EF4444', group: 'needs' },
      { id: 'specialist-visits', name: 'Specialist visits', color: '#EF4444', group: 'needs' },
      { id: 'medical-tests', name: 'Medical tests', color: '#EF4444', group: 'needs' },
      { id: 'medication', name: 'Medication', color: '#EF4444', group: 'needs' },
      { id: 'medical-supplies', name: 'Medical supplies', color: '#EF4444', group: 'needs' },
      { id: 'emotional-support', name: 'Emotional Support / Mental Health', color: '#EF4444', group: 'needs' }
    ]
  },

  // 3. Household Operations (Mixed)
  {
    id: 'household-operations',
    name: 'Household Operations',
    color: '#10B981',
    group: 'needs',
    children: [
      { id: 'cleaning-housekeeping', name: 'Cleaning & Housekeeping', color: '#10B981', group: 'wants' },
      { id: 'housekeeper', name: 'Housekeeper', color: '#10B981', group: 'wants' },
      { id: 'laundry', name: 'Laundry', color: '#10B981', group: 'needs' },
      { id: 'care', name: 'Care', color: '#10B981', group: 'needs' },
      { id: 'garden-services', name: 'Garden services', color: '#10B981', group: 'wants' },
      { id: 'yard', name: 'Yard', color: '#10B981', group: 'wants' },
      { id: 'pool-maintenance', name: 'Pool maintenance', color: '#10B981', group: 'wants' },
      { id: 'pest-control', name: 'Pest control', color: '#10B981', group: 'needs' },
      { id: 'household-repairs', name: 'Household repairs', color: '#10B981', group: 'needs' },
      { id: 'appliance-repairs', name: 'Appliance repairs', color: '#10B981', group: 'needs' }
    ]
  },

  // 4. Groceries & Household Supplies (Needs)
  {
    id: 'groceries-household',
    name: 'Groceries & Household Supplies',
    color: '#22C55E',
    group: 'needs',
    children: [
      { id: 'groceries', name: 'Groceries', color: '#22C55E', group: 'needs' },
      { id: 'pet-food-supplies', name: 'Pet food & supplies', color: '#22C55E', group: 'needs' },
      { id: 'toiletries', name: 'Toiletries', color: '#22C55E', group: 'needs' },
      { id: 'paper-goods', name: 'Paper goods', color: '#22C55E', group: 'needs' }
    ]
  },

  // 5. Transportation (Needs)
  {
    id: 'transportation',
    name: 'Transportation',
    color: '#F97316',
    group: 'needs',
    children: [
      { id: 'fuel', name: 'Fuel', color: '#F97316', group: 'needs' },
      { id: 'taxi-rideshare', name: 'Taxi / rideshare', color: '#F97316', group: 'needs' },
      { id: 'public-transportation', name: 'Public transportation', color: '#F97316', group: 'needs' },
      { id: 'vehicle-maintenance', name: 'Vehicle maintenance', color: '#F97316', group: 'needs' },
      { id: 'vehicle-insurance', name: 'Vehicle insurance', color: '#F97316', group: 'needs' },
      { id: 'vehicle-loan', name: 'Vehicle loan payment', color: '#F97316', group: 'needs' }
    ]
  },

  // 6. Insurance & Financial (Needs/Savings)
  {
    id: 'insurance-financial',
    name: 'Insurance & Financial',
    color: '#6366F1',
    group: 'needs',
    children: [
      { id: 'health-insurance', name: 'Health insurance', color: '#6366F1', group: 'needs' },
      { id: 'life-insurance', name: 'Life insurance', color: '#6366F1', group: 'needs' },
      { id: 'home-insurance', name: 'Home insurance', color: '#6366F1', group: 'needs' },
      { id: 'other-insurance', name: 'Other insurance', color: '#6366F1', group: 'needs' },
      { id: 'loan-repayments', name: 'Loan repayments', color: '#6366F1', group: 'needs' },
      { id: 'minimum-debt', name: 'Minimum Debt', color: '#6366F1', group: 'needs' },
      { id: 'bank-fees', name: 'Bank fees', color: '#6366F1', group: 'needs' },
      { id: 'savings', name: 'Savings', color: '#6366F1', group: 'savings' },
      { id: 'investments', name: 'Investments', color: '#6366F1', group: 'savings' }
    ]
  },

  // 7. Personal Care & Wellness (Wants)
  {
    id: 'personal-care',
    name: 'Personal Care & Wellness',
    color: '#EC4899',
    group: 'wants',
    children: [
      { id: 'haircuts-grooming', name: 'Haircuts & grooming', color: '#EC4899', group: 'wants' },
      { id: 'spa-massage', name: 'Spa & massage', color: '#EC4899', group: 'wants' },
      { id: 'gym-membership', name: 'Gym membership', color: '#EC4899', group: 'wants' },
      { id: 'vitamins-supplements', name: 'Vitamins & supplements', color: '#EC4899', group: 'wants' }
    ]
  },

  // 8. Education & Child Expenses (Needs)
  {
    id: 'education-child',
    name: 'Education & Child Expenses',
    color: '#8B5CF6',
    group: 'needs',
    children: [
      { id: 'school-fees', name: 'School fees', color: '#8B5CF6', group: 'needs' },
      { id: 'books-stationery', name: 'Books & stationery', color: '#8B5CF6', group: 'needs' },
      { id: 'extracurricular', name: 'Extracurricular activities', color: '#8B5CF6', group: 'wants' },
      { id: 'school-uniforms', name: 'School uniforms', color: '#8B5CF6', group: 'needs' },
      { id: 'childcare', name: 'Childcare', color: '#8B5CF6', group: 'needs' },
      { id: 'tutoring-homework', name: 'Tutoring & Homework Help', color: '#8B5CF6', group: 'wants' },
      { id: 'child-food', name: 'Child food & snacks', color: '#8B5CF6', group: 'needs' },
      { id: 'child-toiletries', name: 'Child toiletries', color: '#8B5CF6', group: 'needs' },
      { id: 'child-clothing', name: 'Child clothing', color: '#8B5CF6', group: 'needs' },
      { id: 'child-toys', name: 'Toys & games', color: '#8B5CF6', group: 'wants' },
      { id: 'child-medical', name: 'Child medical & dental', color: '#8B5CF6', group: 'needs' }
    ]
  },

  // 9. Entertainment & Leisure (Wants)
  {
    id: 'entertainment-leisure',
    name: 'Entertainment & Leisure',
    color: '#F59E0B',
    group: 'wants',
    children: [
      { id: 'dining-out', name: 'Dining out', color: '#F59E0B', group: 'wants' },
      { id: 'subscriptions', name: 'Subscriptions', color: '#F59E0B', group: 'wants' },
      { id: 'events-tickets', name: 'Events & tickets', color: '#F59E0B', group: 'wants' },
      { id: 'hobbies-crafts', name: 'Hobbies & crafts', color: '#F59E0B', group: 'wants' }
    ]
  },

  // 10. Gifts & Special Occasions (Wants)
  {
    id: 'gifts-occasions',
    name: 'Gifts & Special Occasions',
    color: '#EF4444',
    group: 'wants',
    children: [
      { id: 'birthday-gifts', name: 'Birthday gifts', color: '#EF4444', group: 'wants' },
      { id: 'holiday-gifts', name: 'Holiday gifts', color: '#EF4444', group: 'wants' },
      { id: 'anniversaries', name: 'Anniversaries', color: '#EF4444', group: 'wants' },
      { id: 'weddings-celebrations', name: 'Weddings & celebrations', color: '#EF4444', group: 'wants' }
    ]
  },

  // 11. Travel & Holidays (Wants)
  {
    id: 'travel-holidays',
    name: 'Travel & Holidays',
    color: '#06B6D4',
    group: 'wants',
    children: [
      { id: 'flights-transport', name: 'Flights & transportation', color: '#06B6D4', group: 'wants' },
      { id: 'accommodation', name: 'Accommodation', color: '#06B6D4', group: 'wants' },
      { id: 'travel-insurance', name: 'Travel insurance', color: '#06B6D4', group: 'wants' },
      { id: 'activities-tours', name: 'Activities & tours', color: '#06B6D4', group: 'wants' }
    ]
  },

  // 12. Miscellaneous (Various)
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    color: '#64748B',
    group: 'needs',
    children: [
      { id: 'emergency-expenses', name: 'Emergency expenses', color: '#64748B', group: 'needs' },
      { id: 'donations-charity', name: 'Donations & charity', color: '#64748B', group: 'wants' },
      { id: 'legal-fees', name: 'Legal fees', color: '#64748B', group: 'needs' },
      { id: 'unplanned-purchases', name: 'Unplanned purchases', color: '#64748B', group: 'wants' },
      { id: 'pet-care', name: 'Pet Care', color: '#64748B', group: 'wants' }
    ]
  },

  // 13. Wants (Lifestyle) - Separate lifestyle category
  {
    id: 'wants-lifestyle',
    name: 'Wants (Lifestyle)',
    color: '#F97316',
    group: 'wants',
    children: [
      { id: 'lifestyle-general', name: 'General lifestyle wants', color: '#F97316', group: 'wants' }
    ]
  },

  // 14. Travel (Main Category)
  {
    id: 'travel-main',
    name: 'Travel',
    color: '#06B6D4',
    group: 'wants',
    children: [
      { id: 'travel-general', name: 'General travel expenses', color: '#06B6D4', group: 'wants' }
    ]
  }
];

// Flatten categories for easy access
export const flattenedCategories = comprehensiveCategories.reduce<DemoCategory[]>((acc, category) => {
  acc.push(category);
  if (category.children) {
    acc.push(...category.children);
  }
  return acc;
}, []);

// Get all categories including children for demo use
export const getAllDemoCategories = (): DemoCategory[] => {
  return flattenedCategories;
};

// Get categories by group
export const getCategoriesByGroup = (group: 'needs' | 'wants' | 'savings'): DemoCategory[] => {
  return flattenedCategories.filter(cat => cat.group === group);
};

// Find category by name or ID
export const findDemoCategory = (identifier: string): DemoCategory | undefined => {
  return flattenedCategories.find(cat => 
    cat.id === identifier || cat.name.toLowerCase().includes(identifier.toLowerCase())
  );
};