// Nuacha Payment Configuration
// Update these values with your actual bank details

export const NUACHA_BANK_DETAILS = {
  bankName: "First Citizens Bank", // UPDATE with your bank
  branch: "Port of Spain", // UPDATE with your branch
  accountNumber: "XXXXXXXX", // UPDATE with your account number
  accountHolder: "Nuacha Ltd", // UPDATE with your account holder name
  accountType: "Business Savings"
};

export const NUACHA_WHATSAPP_NUMBER = "18681234567"; // UPDATE with your WhatsApp number

export const NUACHA_SUBSCRIPTION_PLANS = {
  families: {
    id: 'families',
    name: 'Families',
    description: 'Perfect for SAHMs & Caregivers',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    lifetimePrice: 199.99,
    features: [
      'Multi-family expense tracking',
      'Smart receipt scanning',
      'Budget planning tools',
      'Replacement reminders',
      'Expense reports',
      'Unlimited family members'
    ],
    badge: 'Most Popular'
  },
  business: {
    id: 'business',
    name: 'Small Business',
    description: 'For T&T businesses with employees',
    monthlyPrice: 14.99,
    yearlyPrice: 149.99,
    lifetimePrice: 299.99,
    features: [
      'Everything in Families',
      'T&T NIS Payroll Calculator',
      'Employee management',
      'Payroll expense tracking',
      'Business expense categories',
      'Tax-ready reports'
    ],
    badge: 'For T&T Businesses'
  },
  entrepreneurs: {
    id: 'entrepreneurs',
    name: 'Entrepreneurs',
    description: 'For those who juggle both worlds',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    lifetimePrice: 399.99,
    features: [
      'Everything in Business',
      'Separate personal & business tracking',
      'Multiple business entities',
      'Advanced categorization',
      'Priority support',
      'Early access to new features'
    ],
    badge: 'Best Value'
  }
} as const;

export type PlanType = keyof typeof NUACHA_SUBSCRIPTION_PLANS;
export type BillingCycle = 'monthly' | 'yearly' | 'lifetime';

export function getPlanPrice(planType: PlanType, billingCycle: BillingCycle): number {
  const plan = NUACHA_SUBSCRIPTION_PLANS[planType];
  switch (billingCycle) {
    case 'monthly':
      return plan.monthlyPrice;
    case 'yearly':
      return plan.yearlyPrice;
    case 'lifetime':
      return plan.lifetimePrice;
  }
}

export function formatPlanName(planType: PlanType): string {
  return NUACHA_SUBSCRIPTION_PLANS[planType].name;
}
