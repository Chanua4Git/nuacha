// Comprehensive 12-category structure for demos and categorization
export interface DemoCategory {
  id: string;
  name: string;
  color: string;
  group: 'needs' | 'wants' | 'savings';
  children?: DemoCategory[];
}

export const comprehensiveCategories: DemoCategory[] = [
  // 🔴 NEEDS (Essential)
  
  // 1. Housing & Utilities (Needs)
  {
    id: 'housing-utilities',
    name: 'Housing & Utilities',
    color: '#0EA5E9',
    group: 'needs',
    children: [
      { id: 'rent-mortgage', name: 'Rent / Mortgage', color: '#0EA5E9', group: 'needs' },
      { id: 'property-taxes', name: 'Property taxes', color: '#0EA5E9', group: 'needs' },
      { id: 'hoa-maintenance', name: 'HOA / Maintenance fees', color: '#0EA5E9', group: 'needs' },
      { id: 'electricity', name: 'Electricity', color: '#0EA5E9', group: 'needs' },
      { id: 'water-sewer', name: 'Water & Sewer', color: '#0EA5E9', group: 'needs' },
      { id: 'gas', name: 'Gas (cooking/heating)', color: '#0EA5E9', group: 'needs' },
      { id: 'garbage-collection', name: 'Garbage collection', color: '#0EA5E9', group: 'needs' },
      { id: 'internet-wifi', name: 'Internet / Wi-Fi', color: '#0EA5E9', group: 'needs' },
      { id: 'mobile-phone', name: 'Mobile Phone Service', color: '#0EA5E9', group: 'needs' },
      { id: 'home-phone', name: 'Home Phone Service', color: '#0EA5E9', group: 'needs' },
      { id: 'cable-streaming', name: 'Cable / Streaming services', color: '#0EA5E9', group: 'wants' }
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
      { id: 'weekday-nurse', name: 'WeekDay nurse', color: '#EF4444', group: 'needs' },
      { id: 'weekend-day-nurse', name: 'Weekend Day Nurse', color: '#EF4444', group: 'needs' },
      { id: 'elderly-care', name: 'Elderly Care / Support', color: '#EF4444', group: 'needs' },
      { id: 'doctor-visits', name: 'Doctor visits', color: '#EF4444', group: 'needs' },
      { id: 'specialist-visits', name: 'Specialist visits', color: '#EF4444', group: 'needs' },
      { id: 'mental-health-therapy', name: 'Mental health therapy / counseling', color: '#EF4444', group: 'needs' },
      { id: 'dental-care', name: 'Dental care (checkups, orthodontics)', color: '#EF4444', group: 'needs' },
      { id: 'vision-care', name: 'Vision care (glasses, contacts, exams)', color: '#EF4444', group: 'needs' },
      { id: 'medication', name: 'Medication (prescriptions)', color: '#EF4444', group: 'needs' },
      { id: 'medical-supplies', name: 'Medical supplies (first aid, devices)', color: '#EF4444', group: 'needs' },
      { id: 'medical-tests', name: 'Medical tests & diagnostics', color: '#EF4444', group: 'needs' },
      { id: 'emergency-care', name: 'Emergency care / ambulance co-pays', color: '#EF4444', group: 'needs' }
    ]
  },

  // 3. Education & Child Expenses (Needs)
  {
    id: 'education-child',
    name: 'Education & Child Expenses',
    color: '#8B5CF6',
    group: 'needs',
    children: [
      { id: 'childcare', name: 'Childcare (nanny/daycare/babysitting/after-school)', color: '#8B5CF6', group: 'needs' },
      { id: 'school-fees', name: 'School fees / tuition', color: '#8B5CF6', group: 'needs' },
      { id: 'books-stationery', name: 'Books & stationery', color: '#8B5CF6', group: 'needs' },
      { id: 'school-uniforms', name: 'School uniforms', color: '#8B5CF6', group: 'needs' },
      { id: 'school-lunches', name: 'School lunches / meal programs', color: '#8B5CF6', group: 'needs' },
      { id: 'school-transportation', name: 'School transportation (bus fees)', color: '#8B5CF6', group: 'needs' },
      { id: 'exam-testing-fees', name: 'Exam / testing fees', color: '#8B5CF6', group: 'needs' },
      { id: 'device-technology-fees', name: 'Device & technology fees', color: '#8B5CF6', group: 'needs' },
      { id: 'tutoring-homework-help', name: 'Tutoring & Homework Help (required/IEP support)', color: '#8B5CF6', group: 'needs' },
      { id: 'camps-school-breaks', name: 'Camps during school breaks (if needed for care)', color: '#8B5CF6', group: 'needs' },
      { id: 'child-food-snacks', name: 'Child food & snacks', color: '#8B5CF6', group: 'needs' },
      { id: 'child-toiletries', name: 'Child toiletries', color: '#8B5CF6', group: 'needs' },
      { id: 'child-medical-dental', name: 'Child medical & dental co-pays', color: '#8B5CF6', group: 'needs' }
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
      { id: 'special-dietary', name: 'Special Dietary Needs (Formula, Baby Food, allergies)', color: '#22C55E', group: 'needs' },
      { id: 'paper-goods', name: 'Paper goods', color: '#22C55E', group: 'needs' },
      { id: 'toiletries', name: 'Toiletries', color: '#22C55E', group: 'needs' },
      { id: 'diapers-wipes', name: 'Diapers & wipes', color: '#22C55E', group: 'needs' },
      { id: 'feminine-care', name: 'Feminine care products', color: '#22C55E', group: 'needs' },
      { id: 'cleaning-supplies', name: 'Cleaning supplies', color: '#22C55E', group: 'needs' },
      { id: 'water-delivery', name: 'Water delivery', color: '#22C55E', group: 'needs' }
    ]
  },

  // 5. Household Operations (Needs portion)
  {
    id: 'household-operations-needs',
    name: 'Household Operations',
    color: '#10B981',
    group: 'needs',
    children: [
      { id: 'cleaning-housekeeping-routine', name: 'Cleaning & Housekeeping (routine)', color: '#10B981', group: 'needs' },
      { id: 'laundry', name: 'Laundry', color: '#10B981', group: 'needs' },
      { id: 'housekeeper-essential', name: 'Housekeeper (essential basis only)', color: '#10B981', group: 'needs' },
      { id: 'household-repairs', name: 'Household repairs & maintenance', color: '#10B981', group: 'needs' },
      { id: 'appliance-repairs', name: 'Appliance repairs', color: '#10B981', group: 'needs' },
      { id: 'garden-services-essential', name: 'Garden services', color: '#10B981', group: 'needs' },
      { id: 'pool-maintenance-essential', name: 'Pool maintenance', color: '#10B981', group: 'needs' },
      { id: 'pest-control', name: 'Pest control', color: '#10B981', group: 'needs' },
      { id: 'domestic-employee-payroll', name: 'Domestic employee payroll (NIS, severance, vacation)', color: '#10B981', group: 'needs' }
    ]
  },

  // 6. Transportation (Needs)
  {
    id: 'transportation',
    name: 'Transportation',
    color: '#F97316',
    group: 'needs',
    children: [
      { id: 'fuel', name: 'Fuel', color: '#F97316', group: 'needs' },
      { id: 'public-transportation', name: 'Public transportation', color: '#F97316', group: 'needs' },
      { id: 'taxi-rideshare', name: 'Taxi / rideshare', color: '#F97316', group: 'needs' },
      { id: 'vehicle-insurance', name: 'Vehicle insurance', color: '#F97316', group: 'needs' },
      { id: 'vehicle-loan', name: 'Vehicle loan payment', color: '#F97316', group: 'needs' },
      { id: 'vehicle-maintenance', name: 'Vehicle maintenance (oil/tires)', color: '#F97316', group: 'needs' },
      { id: 'registration-inspection', name: 'Registration / inspection', color: '#F97316', group: 'needs' },
      { id: 'parking-fees', name: 'Parking fees', color: '#F97316', group: 'needs' },
      { id: 'tolls', name: 'Tolls', color: '#F97316', group: 'needs' },
      { id: 'roadside-assistance', name: 'Roadside assistance (auto club)', color: '#F97316', group: 'needs' },
      { id: 'drivers-license', name: 'Driver\'s license renewal', color: '#F97316', group: 'needs' }
    ]
  },

  // 7. Insurance & Financial (Needs)
  {
    id: 'insurance-financial',
    name: 'Insurance & Financial',
    color: '#6366F1',
    group: 'needs',
    children: [
      { id: 'health-insurance', name: 'Health insurance', color: '#6366F1', group: 'needs' },
      { id: 'dental-insurance', name: 'Dental insurance', color: '#6366F1', group: 'needs' },
      { id: 'life-insurance', name: 'Life insurance', color: '#6366F1', group: 'needs' },
      { id: 'home-insurance', name: 'Home insurance', color: '#6366F1', group: 'needs' },
      { id: 'other-insurance', name: 'Other insurance (disability, critical illness, contents)', color: '#6366F1', group: 'needs' },
      { id: 'loan-repayments', name: 'Loan repayments (non-vehicle)', color: '#6366F1', group: 'needs' },
      { id: 'student-loans', name: 'Student loan payments', color: '#6366F1', group: 'needs' },
      { id: 'minimum-debt', name: 'Minimum debt payments', color: '#6366F1', group: 'needs' },
      { id: 'extra-debt', name: 'Extra debt payments (snowball/avalanche)', color: '#6366F1', group: 'needs' },
      { id: 'annuity-payments', name: 'Annuity payments', color: '#6366F1', group: 'needs' },
      { id: 'child-support', name: 'Child support paid / alimony', color: '#6366F1', group: 'needs' }
    ]
  },

  // 8. Pet Care (Needs - if you already have a pet)
  {
    id: 'pet-care-needs',
    name: 'Pet Care',
    color: '#64748B',
    group: 'needs',
    children: [
      { id: 'pet-food-supplies', name: 'Pet food & supplies', color: '#64748B', group: 'needs' },
      { id: 'vet-visits', name: 'Vet visits & vaccinations', color: '#64748B', group: 'needs' },
      { id: 'pet-medications', name: 'Pet medications', color: '#64748B', group: 'needs' },
      { id: 'pet-grooming', name: 'Grooming', color: '#64748B', group: 'needs' },
      { id: 'pet-boarding', name: 'Boarding / pet sitting', color: '#64748B', group: 'needs' }
    ]
  },

  // 9. Miscellaneous (Essential)
  {
    id: 'miscellaneous-needs',
    name: 'Miscellaneous (Essential)',
    color: '#64748B',
    group: 'needs',
    children: [
      { id: 'bank-fees', name: 'Bank fees', color: '#64748B', group: 'needs' },
      { id: 'legal-fees', name: 'Legal fees (custody/mediation/notary)', color: '#64748B', group: 'needs' },
      { id: 'emergency-expenses', name: 'Emergency expenses', color: '#64748B', group: 'needs' },
      { id: 'postage-shipping', name: 'Postage / shipping / PO box', color: '#64748B', group: 'needs' }
    ]
  },

  // 🟡 WANTS (Discretionary)

  // 10. Entertainment & Leisure (Wants)
  {
    id: 'entertainment-leisure',
    name: 'Entertainment & Leisure',
    color: '#F59E0B',
    group: 'wants',
    children: [
      { id: 'dining-out', name: 'Dining out / takeout', color: '#F59E0B', group: 'wants' },
      { id: 'snacks-treats', name: 'Snacks & treats', color: '#F59E0B', group: 'wants' },
      { id: 'events-tickets', name: 'Events & tickets', color: '#F59E0B', group: 'wants' },
      { id: 'hobbies-crafts', name: 'Hobbies & crafts', color: '#F59E0B', group: 'wants' },
      { id: 'subscriptions', name: 'Subscriptions (apps, magazines, streaming)', color: '#F59E0B', group: 'wants' }
    ]
  },

  // 11. Personal Care & Wellness (Wants)
  {
    id: 'personal-care-wants',
    name: 'Personal Care & Wellness',
    color: '#EC4899',
    group: 'wants',
    children: [
      { id: 'haircuts-grooming', name: 'Haircuts & grooming', color: '#EC4899', group: 'wants' },
      { id: 'spa-massage', name: 'Spa & massage', color: '#EC4899', group: 'wants' },
      { id: 'gym-membership', name: 'Gym membership', color: '#EC4899', group: 'wants' },
      { id: 'skincare', name: 'Skincare', color: '#EC4899', group: 'wants' },
      { id: 'vitamins-supplements', name: 'Vitamins & supplements', color: '#EC4899', group: 'wants' },
      { id: 'personal-services', name: 'Personal Services (piercing, tattoo, nails, waxing)', color: '#EC4899', group: 'wants' }
    ]
  },

  // 12. Kids & Family (Wants - non-school related)
  {
    id: 'kids-family',
    name: 'Kids & Family',
    color: '#A855F7',
    group: 'wants',
    children: [
      { id: 'kids-toys', name: 'Kids Toys & Games', color: '#A855F7', group: 'wants' },
      { id: 'kids-clothing', name: 'Kids Clothing & Shoes', color: '#A855F7', group: 'wants' },
      { id: 'kids-activities', name: 'Kids Activities & Entertainment', color: '#A855F7', group: 'wants' },
      { id: 'kids-allowance', name: 'Kids Pocket Money / Allowance', color: '#A855F7', group: 'wants' },
      { id: 'kids-birthday-parties', name: 'Kids Birthday Parties', color: '#A855F7', group: 'wants' }
    ]
  },

  // 13. Gifts & Special Occasions (Wants)
  {
    id: 'gifts-occasions',
    name: 'Gifts & Special Occasions',
    color: '#EF4444',
    group: 'wants',
    children: [
      { id: 'anniversaries', name: 'Anniversaries', color: '#EF4444', group: 'wants' },
      { id: 'birthday-gifts', name: 'Birthday gifts', color: '#EF4444', group: 'wants' },
      { id: 'holiday-gifts', name: 'Holiday gifts', color: '#EF4444', group: 'wants' },
      { id: 'weddings-celebrations', name: 'Weddings & celebrations', color: '#EF4444', group: 'wants' },
      { id: 'teacher-school-gifts', name: 'Teacher / school gifts', color: '#EF4444', group: 'wants' }
    ]
  },

  // 14. Travel & Holidays (Wants)
  {
    id: 'travel-holidays',
    name: 'Travel & Holidays',
    color: '#06B6D4',
    group: 'wants',
    children: [
      { id: 'accommodation', name: 'Accommodation', color: '#06B6D4', group: 'wants' },
      { id: 'flights-transport', name: 'Flights & transportation', color: '#06B6D4', group: 'wants' },
      { id: 'activities-tours', name: 'Activities & tours', color: '#06B6D4', group: 'wants' },
      { id: 'travel-insurance', name: 'Travel insurance', color: '#06B6D4', group: 'wants' },
      { id: 'passports-visas', name: 'Passports / visas', color: '#06B6D4', group: 'wants' }
    ]
  },

  // 15. Household Operations (Wants portion)
  {
    id: 'household-operations-wants',
    name: 'Household Operations (Wants)',
    color: '#10B981',
    group: 'wants',
    children: [
      { id: 'deep-cleaning', name: 'Deep cleaning / one-off cleans', color: '#10B981', group: 'wants' },
      { id: 'housekeeper-extra', name: 'Housekeeper (extra hours)', color: '#10B981', group: 'wants' },
      { id: 'garden-services-wants', name: 'Garden services (non-essential)', color: '#10B981', group: 'wants' },
      { id: 'pool-maintenance-wants', name: 'Pool maintenance (non-essential)', color: '#10B981', group: 'wants' },
      { id: 'yard', name: 'Yard', color: '#10B981', group: 'wants' }
    ]
  },

  // 16. Education & Child (Wants portion)
  {
    id: 'education-child-wants',
    name: 'Education & Child (Wants)',
    color: '#8B5CF6',
    group: 'wants',
    children: [
      { id: 'extracurricular', name: 'Extracurricular activities / sports / music', color: '#8B5CF6', group: 'wants' },
      { id: 'tutoring-enrichment', name: 'Tutoring & enrichment (optional)', color: '#8B5CF6', group: 'wants' },
      { id: 'clubs-memberships', name: 'Clubs & memberships', color: '#8B5CF6', group: 'wants' },
      { id: 'camps-enrichment', name: 'Camps (enrichment vs. care)', color: '#8B5CF6', group: 'wants' }
    ]
  },

  // 17. Technology & Lifestyle (Wants)
  {
    id: 'technology-lifestyle',
    name: 'Technology & Lifestyle',
    color: '#3B82F6',
    group: 'wants',
    children: [
      { id: 'device-upgrades', name: 'Device upgrades & accessories', color: '#3B82F6', group: 'wants' },
      { id: 'cloud-storage', name: 'Cloud storage & premium apps', color: '#3B82F6', group: 'wants' },
      { id: 'lifestyle-general', name: 'General lifestyle wants (catch-all)', color: '#3B82F6', group: 'wants' }
    ]
  },

  // 💚 SAVINGS & INVESTMENTS

  // 18. Core Savings
  {
    id: 'core-savings',
    name: 'Core Savings',
    color: '#22C55E',
    group: 'savings',
    children: [
      { id: 'emergency-fund', name: 'Emergency fund', color: '#22C55E', group: 'savings' },
      { id: 'home-maintenance-fund', name: 'Home maintenance & appliance replacement', color: '#22C55E', group: 'savings' },
      { id: 'vehicle-maintenance-fund', name: 'Vehicle maintenance & replacement', color: '#22C55E', group: 'savings' },
      { id: 'medical-dental-fund', name: 'Medical / dental out-of-pocket', color: '#22C55E', group: 'savings' },
      { id: 'education-costs-fund', name: 'Education costs (fees, uniforms, devices)', color: '#22C55E', group: 'savings' },
      { id: 'gifts-holidays-fund', name: 'Gifts & holidays', color: '#22C55E', group: 'savings' },
      { id: 'travel-fund', name: 'Travel fund', color: '#22C55E', group: 'savings' },
      { id: 'pet-care-fund', name: 'Pet care fund', color: '#22C55E', group: 'savings' }
    ]
  },

  // 19. Long-Term
  {
    id: 'long-term-savings',
    name: 'Long-Term',
    color: '#059669',
    group: 'savings',
    children: [
      { id: 'retirement-contributions', name: 'Retirement contributions', color: '#059669', group: 'savings' },
      { id: 'education-savings', name: 'Education savings (college/tertiary fund)', color: '#059669', group: 'savings' },
      { id: 'investments', name: 'Investments (brokerage, mutual funds, unit trusts)', color: '#059669', group: 'savings' },
      { id: 'insurance-deductibles', name: 'Insurance deductibles reserve', color: '#059669', group: 'savings' }
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