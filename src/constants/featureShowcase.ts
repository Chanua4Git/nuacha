import { LucideIcon, Receipt, Users, PiggyBank, Baby, Heart, Home, HandHeart, GraduationCap, Briefcase, Shield, Calculator, Mic, Wallet, CreditCard, Map, Image as ImageIcon, GraduationCap as Lessons, HeartHandshake } from 'lucide-react';

export interface FeatureShowcaseItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  benefitsFor: string[];
  featureTypes: string[];
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
  { id: 'talk-it-through', title: 'Talk it through', description: 'Tap Speak and say what you spent — "250 on groceries, 400 for the light bill". Nuacha shows what it understood and nothing saves until you say so. Daily and monthly check-ins included.', icon: Mic, benefitsFor: ['Families & Parents', 'Caregivers', 'Self-Employed', 'Consumers'], featureTypes: ['receipts', 'budgeting'], ctaText: 'Try Talk it through', ctaPath: '/?talk=true' },
  { id: 'accounts-paid-from', title: 'Accounts, cash & "Paid from"', description: 'Add your bank accounts, log cash withdrawals and choose which account paid for each expense. Balances work themselves out, and usual accounts fill in for you.', icon: Wallet, benefitsFor: ['Families & Parents', 'Caregivers', 'Homeowners'], featureTypes: ['budgeting'], ctaText: 'Open Cash & Accounts', ctaPath: '/money' },
  { id: 'credit-card', title: 'Credit card tracking', description: 'See card purchases next to everything else and keep an eye on your limit.', icon: CreditCard, benefitsFor: ['Consumers', 'Families & Parents'], featureTypes: ['budgeting'], ctaText: 'See your accounts', ctaPath: '/money' },
  { id: 'nuacha-map', title: 'Your Nuacha map', description: 'One simple picture of everything Nuacha can do, what you have tried, and your easiest next step.', icon: Map, benefitsFor: ['Families & Parents', 'Consumers', 'Students'], featureTypes: ['reports'], ctaText: 'Open your dashboard', ctaPath: '/dashboard#nuacha-map' },
  { id: 'story-cards', title: 'Story cards & summaries', description: 'Turn your week, month or year into a shareable image. Private receipt details stay blurred and never leave your phone.', icon: ImageIcon, benefitsFor: ['Families & Parents', 'Consumers'], featureTypes: ['reports'], ctaText: 'See your reports', ctaPath: '/reports' },
  { id: 'learning-lessons', title: 'Short lessons, with help', description: '2–3 minute lessons that remember your progress on any device. Stuck? Ask a question at the end of any lesson.', icon: Lessons, benefitsFor: ['Families & Parents', 'Students', 'Consumers'], featureTypes: ['receipts'], ctaText: 'Start learning', ctaPath: '/updates?tab=learning' },
  { id: 'setup-session', title: 'Setup with Chan', description: 'Hand-holding (TT$100) or done-for-you (TT$300), remote or in person. Bring your receipts — we handle the rest.', icon: HeartHandshake, benefitsFor: ['Families & Parents', 'Caregivers', 'Small Business'], featureTypes: ['family'], isLocalTT: true, ctaText: 'Choose a setup', ctaPath: '/setup?section=calendar#setup-calendar' },
  {
    id: 'receipt-scanning',
    title: 'Smart Receipt Scanning',
    description: 'Snap a photo or upload receipts—our AI extracts vendor, date, amount, and line items automatically. Store digital proof for tax audits, insurance claims, or reimbursements.',
    icon: Receipt,
    benefitsFor: ['Taxpayers', 'Employees', 'Self-Employed', 'Homeowners', 'Insurance Claims', 'Consumers', 'Families & Parents', 'Students', 'Charitable Donors', 'Health Claimants', 'Landlords'],
    featureTypes: ['receipts'],
    ctaText: 'Try receipt scanning',
    ctaPath: '/app?tab=add-expense',
  },
  {
    id: 'multi-family',
    title: 'Multi-Family Management',
    description: 'Track expenses for multiple households from one account. Manage down to the individual member level—see exactly who spent what within each family. Perfect for caregivers managing parents\' finances, landlords with multiple properties, or families with custody arrangements.',
    icon: Users,
    benefitsFor: ['Families & Parents', 'Landlords', 'Caregivers'],
    featureTypes: ['family', 'receipts'],
    ctaText: 'Manage families',
    ctaPath: '/options?tab=families',
  },
  {
    id: 'budget-builder',
    title: 'Budget Builder',
    description: 'Create custom budgets with flexible allocation rules (50/30/20, zero-based, or custom). Track actual spending vs budget with real-time variance alerts.',
    icon: PiggyBank,
    benefitsFor: ['Families & Parents', 'Self-Employed', 'Students'],
    featureTypes: ['budgeting'],
    ctaText: 'Build your budget',
    ctaPath: '/budget',
  },
  {
    id: 'child-expenses',
    title: 'Child Expense Tracking',
    description: 'Pre-built categories for child-related costs: school fees, uniforms, activities, medical, childcare. Ideal for custody agreements, childcare subsidies, or family budgeting.',
    icon: Baby,
    benefitsFor: ['Families & Parents', 'Guardians', 'Custody Tracking'],
    featureTypes: ['family', 'receipts'],
    ctaText: 'Track child expenses',
    ctaPath: '/app?tab=expenses',
  },
  {
    id: 'medical-expenses',
    title: 'Medical Expense Management',
    description: 'Categorize medical visits, prescriptions, therapies, and wellness expenses. Generate reports for health insurance, FSA/HSA claims, or tax deductions.',
    icon: Heart,
    benefitsFor: ['Health Claimants', 'Insurance Claims', 'Taxpayers'],
    featureTypes: ['receipts'],
    ctaText: 'Track medical costs',
    ctaPath: '/app?tab=add-expense',
  },
  {
    id: 'home-improvement',
    title: 'Home Improvement Tracking',
    description: 'Document renovations, repairs, and maintenance with receipt storage. Build cost basis for property sales, insurance claims, or warranty validation.',
    icon: Home,
    benefitsFor: ['Homeowners', 'Landlords', 'Insurance Claims'],
    featureTypes: ['receipts'],
    ctaText: 'Track improvements',
    ctaPath: '/app?tab=expenses',
  },
  {
    id: 'donation-tracking',
    title: 'Donation Receipt Storage',
    description: 'Store charity receipts and acknowledgments digitally. Generate annual summaries for tax deductions and gift claims worldwide.',
    icon: HandHeart,
    benefitsFor: ['Charitable Donors', 'Taxpayers'],
    featureTypes: ['receipts'],
    ctaText: 'Track donations',
    ctaPath: '/app?tab=add-expense',
  },
  {
    id: 'student-expenses',
    title: 'Student Expense Tracking',
    description: 'Track tuition, books, supplies, exam fees, and living expenses. Perfect for education grants, benefits, or tax relief applications.',
    icon: GraduationCap,
    benefitsFor: ['Students', 'Families & Parents', 'Taxpayers'],
    featureTypes: ['receipts'],
    ctaText: 'Track education costs',
    ctaPath: '/app?tab=expenses',
  },
  {
    id: 'business-expenses',
    title: 'Business Expense Management',
    description: 'Track travel, supplies, meals, equipment, and client expenses. Generate reports for tax deductions, quarterly filings, and business planning.',
    icon: Briefcase,
    benefitsFor: ['Self-Employed', 'Freelancers', 'Small Businesses', 'Taxpayers'],
    featureTypes: ['receipts'],
    ctaText: 'Manage business expenses',
    ctaPath: '/app?tab=expenses',
  },
  {
    id: 'insurance-claims',
    title: 'Insurance & Disaster Claims',
    description: 'Store receipts for damaged items, repairs, and replacement costs. Document proof for insurance claims, relief funds, and temporary accommodation reimbursement.',
    icon: Shield,
    benefitsFor: ['Insurance Claims', 'Homeowners', 'Property Owners'],
    featureTypes: ['receipts'],
    ctaText: 'Prepare for claims',
    ctaPath: '/app?tab=expenses',
  },
  {
    id: 'per-household-tracking',
    title: 'Per-Household & Member Tracking',
    description: 'Track expenses at the household level and drill down to individual family members. See who spent what within each family—perfect for shared households, families with children, or custody arrangements.',
    icon: Users,
    benefitsFor: ['Families & Parents', 'Guardians', 'Custody Tracking', 'Caregivers'],
    featureTypes: ['family', 'receipts'],
    ctaText: 'Track by member',
    ctaPath: '/app?tab=expenses',
  },
  {
    id: 'tt-payroll',
    title: 'Trinidad & Tobago NIS Payroll Calculator',
    description: 'Calculate NIS contributions accurately using official T&T earnings classes and rates. Generate payroll reports for weekly, monthly, and annual periods. Fully compliant with Trinidad & Tobago labor laws.',
    icon: Calculator,
    benefitsFor: ['🇹🇹 T&T Businesses', 'T&T Employers', 'T&T Payroll Admins'],
    featureTypes: ['payroll'],
    isLocalTT: true,
    ctaText: 'Calculate NIS payroll',
    ctaPath: '/payroll?tab=calculator',
  },
];
