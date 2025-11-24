import { LucideIcon, Receipt, Users, PiggyBank, Baby, Heart, Home, HandHeart, GraduationCap, Briefcase, Shield, Calculator } from 'lucide-react';

export interface FeatureShowcaseItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  benefitsFor: string[];
  isLocalTT?: boolean;
  ctaText: string;
  ctaPath: string;
  imageUrl?: string;
}

export const userTypeFilters = [
  { id: 'all', label: 'All Features' },
  { id: 'taxpayers', label: 'Taxpayers' },
  { id: 'families', label: 'Families & Parents' },
  { id: 'self-employed', label: 'Self-Employed' },
  { id: 'employees', label: 'Employees' },
  { id: 'donors', label: 'Charitable Donors' },
  { id: 'health', label: 'Health Claimants' },
  { id: 'homeowners', label: 'Homeowners' },
  { id: 'students', label: 'Students' },
  { id: 'landlords', label: 'Landlords' },
  { id: 'insurance', label: 'Insurance Claims' },
  { id: 'tt-business', label: '🇹🇹 T&T Businesses' },
];

export const featureTypeFilters = [
  { id: 'all', label: 'All Types' },
  { id: 'receipts', label: 'Receipt Management' },
  { id: 'budgeting', label: 'Budgeting' },
  { id: 'family', label: 'Family Management' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'reports', label: 'Reports & Analytics' },
];

export const features: FeatureShowcaseItem[] = [
  {
    id: 'receipt-scanning',
    title: 'Smart Receipt Scanning',
    description: 'Snap a photo or upload receipts—our AI extracts vendor, date, amount, and line items automatically. Store digital proof for tax audits, insurance claims, or reimbursements.',
    icon: Receipt,
    benefitsFor: ['Taxpayers', 'Employees', 'Self-Employed', 'Homeowners', 'Insurance Claims', 'Consumers'],
    ctaText: 'Try receipt scanning',
    ctaPath: '/app?tab=add-expense',
  },
  {
    id: 'multi-family',
    title: 'Multi-Family Management',
    description: 'Track expenses for multiple households from one account. Perfect for caregivers managing parents\' finances, landlords with multiple properties, or families with custody arrangements.',
    icon: Users,
    benefitsFor: ['Families & Parents', 'Landlords', 'Caregivers'],
    ctaText: 'Manage families',
    ctaPath: '/options?tab=families',
  },
  {
    id: 'budget-builder',
    title: 'Budget Builder',
    description: 'Create custom budgets with flexible allocation rules (50/30/20, zero-based, or custom). Track actual spending vs budget with real-time variance alerts.',
    icon: PiggyBank,
    benefitsFor: ['Families & Parents', 'Self-Employed', 'Students'],
    ctaText: 'Build your budget',
    ctaPath: '/budget',
  },
  {
    id: 'child-expenses',
    title: 'Child Expense Tracking',
    description: 'Pre-built categories for child-related costs: school fees, uniforms, activities, medical, childcare. Ideal for custody agreements, childcare subsidies, or family budgeting.',
    icon: Baby,
    benefitsFor: ['Families & Parents', 'Guardians', 'Custody Tracking'],
    ctaText: 'Track child expenses',
    ctaPath: '/app?tab=expenses',
  },
  {
    id: 'medical-expenses',
    title: 'Medical Expense Management',
    description: 'Categorize medical visits, prescriptions, therapies, and wellness expenses. Generate reports for health insurance, FSA/HSA claims, or tax deductions.',
    icon: Heart,
    benefitsFor: ['Health Claimants', 'Insurance Claims', 'Taxpayers'],
    ctaText: 'Track medical costs',
    ctaPath: '/app?tab=add-expense',
  },
  {
    id: 'home-improvement',
    title: 'Home Improvement Tracking',
    description: 'Document renovations, repairs, and maintenance with receipt storage. Build cost basis for property sales, insurance claims, or warranty validation.',
    icon: Home,
    benefitsFor: ['Homeowners', 'Landlords', 'Insurance Claims'],
    ctaText: 'Track improvements',
    ctaPath: '/app?tab=expenses',
  },
  {
    id: 'donation-tracking',
    title: 'Donation Receipt Storage',
    description: 'Store charity receipts and acknowledgments digitally. Generate annual summaries for tax deductions and gift claims worldwide.',
    icon: HandHeart,
    benefitsFor: ['Charitable Donors', 'Taxpayers'],
    ctaText: 'Track donations',
    ctaPath: '/app?tab=add-expense',
  },
  {
    id: 'student-expenses',
    title: 'Student Expense Tracking',
    description: 'Track tuition, books, supplies, exam fees, and living expenses. Perfect for education grants, benefits, or tax relief applications.',
    icon: GraduationCap,
    benefitsFor: ['Students', 'Families & Parents', 'Taxpayers'],
    ctaText: 'Track education costs',
    ctaPath: '/app?tab=expenses',
  },
  {
    id: 'business-expenses',
    title: 'Business Expense Management',
    description: 'Track travel, supplies, meals, equipment, and client expenses. Generate reports for tax deductions, quarterly filings, and business planning.',
    icon: Briefcase,
    benefitsFor: ['Self-Employed', 'Freelancers', 'Small Businesses', 'Taxpayers'],
    ctaText: 'Manage business expenses',
    ctaPath: '/app?tab=expenses',
  },
  {
    id: 'insurance-claims',
    title: 'Insurance & Disaster Claims',
    description: 'Store receipts for damaged items, repairs, and replacement costs. Document proof for insurance claims, relief funds, and temporary accommodation reimbursement.',
    icon: Shield,
    benefitsFor: ['Insurance Claims', 'Homeowners', 'Property Owners'],
    ctaText: 'Prepare for claims',
    ctaPath: '/app?tab=expenses',
  },
  {
    id: 'tt-payroll',
    title: 'Trinidad & Tobago NIS Payroll Calculator',
    description: 'Calculate NIS contributions accurately using official T&T earnings classes and rates. Generate payroll reports for weekly, monthly, and annual periods. Fully compliant with Trinidad & Tobago labor laws.',
    icon: Calculator,
    benefitsFor: ['🇹🇹 T&T Businesses', 'T&T Employers', 'T&T Payroll Admins'],
    isLocalTT: true,
    ctaText: 'Calculate NIS payroll',
    ctaPath: '/payroll',
  },
];
