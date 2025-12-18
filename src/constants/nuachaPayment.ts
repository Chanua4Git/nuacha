// Nuacha Payment Configuration - Storage-Based Premium Pricing (TTD-First)

export const NUACHA_BANK_DETAILS = {
  bankName: "First Citizens Bank",
  branch: "Port of Spain",
  accountNumber: "2991223",
  accountHolder: "Nuacha Ltd",
  accountType: "Business Savings"
};

export const NUACHA_WHATSAPP_NUMBER = "18687865357";

// TTD to USD conversion rate (approximate)
export const TTD_TO_USD_RATE = 6.8;

export const NUACHA_SUBSCRIPTION_PLANS = {
  getting_tidy: {
    id: 'getting_tidy',
    name: 'Getting Tidy',
    tagline: 'Start bringing order to your finances',
    storageMB: 500,
    dailyScanLimit: 3,
    monthlyPriceTTD: 0,
    yearlyPriceTTD: 0,
    monthlyPriceUSD: 0,
    yearlyPriceUSD: 0,
    features: [
      'Basic expense tracking',
      'Single family',
      'Receipt scanning (3/day)',
      '500MB storage'
    ],
    badge: 'Free Forever'
  },
  staying_organized: {
    id: 'staying_organized',
    name: 'Staying Organized',
    tagline: 'Keep your household finances in perfect order',
    storageMB: 10240, // 10GB
    dailyScanLimit: null, // Unlimited until storage reached
    monthlyPriceTTD: 149,
    yearlyPriceTTD: 1490, // ~17% savings (2 months free)
    monthlyPriceUSD: 21.91,
    yearlyPriceUSD: 219.12,
    features: [
      '10GB secure storage',
      'Unlimited receipt scans',
      'Multi-family tracking',
      'AI smart categorization',
      'Budget builder (50/30/20)',
      'Financial reports & export',
      'Smart reminders',
      'Per-member expense assignment'
    ],
    badge: 'Most Popular'
  },
  fully_streamlined: {
    id: 'fully_streamlined',
    name: 'Fully Streamlined',
    tagline: 'Complete financial clarity for busy households',
    storageMB: 25600, // 25GB
    dailyScanLimit: null, // Unlimited until storage reached
    monthlyPriceTTD: 349,
    yearlyPriceTTD: 3490, // ~17% savings (2 months free)
    monthlyPriceUSD: 51.32,
    yearlyPriceUSD: 513.24,
    features: [
      'Everything in Staying Organized',
      '25GB secure storage',
      '🇹🇹 T&T NIS Payroll Calculator',
      'Employee shift tracking',
      'Quick pay entry',
      'Priority support',
      'Early access to features'
    ],
    badge: 'For Households with Helpers'
  }
} as const;

export const STORAGE_ADDON = {
  sizeMB: 10240, // 10GB
  priceTTD: 25,
  priceUSD: 3.68
};

export type PlanType = keyof typeof NUACHA_SUBSCRIPTION_PLANS | 'families' | 'business' | 'entrepreneurs';
export type BillingCycle = 'monthly' | 'yearly';

// Legacy plan name mapping
export const LEGACY_PLAN_MAP: Record<string, keyof typeof NUACHA_SUBSCRIPTION_PLANS> = {
  families: 'staying_organized',
  business: 'fully_streamlined',
  entrepreneurs: 'fully_streamlined'
};

// Get normalized plan (handles legacy names)
export function getNormalizedPlan(planType: PlanType): keyof typeof NUACHA_SUBSCRIPTION_PLANS {
  if (planType in LEGACY_PLAN_MAP) {
    return LEGACY_PLAN_MAP[planType as keyof typeof LEGACY_PLAN_MAP];
  }
  return planType as keyof typeof NUACHA_SUBSCRIPTION_PLANS;
}

// Helper functions
export function formatTTD(amount: number): string {
  return `TT$${amount.toLocaleString()}`;
}

export function formatUSD(amount: number): string {
  return `~US$${amount.toFixed(2)}`;
}

export function getPlanPriceTTD(planType: PlanType, billingCycle: BillingCycle): number {
  const normalizedPlan = getNormalizedPlan(planType);
  const plan = NUACHA_SUBSCRIPTION_PLANS[normalizedPlan];
  return billingCycle === 'monthly' ? plan.monthlyPriceTTD : plan.yearlyPriceTTD;
}

export function getPlanPriceUSD(planType: PlanType, billingCycle: BillingCycle): number {
  const normalizedPlan = getNormalizedPlan(planType);
  const plan = NUACHA_SUBSCRIPTION_PLANS[normalizedPlan];
  return billingCycle === 'monthly' ? plan.monthlyPriceUSD : plan.yearlyPriceUSD;
}

// Legacy function for backward compatibility
export function getPlanPrice(planType: PlanType, billingCycle: BillingCycle): number {
  return getPlanPriceTTD(planType, billingCycle);
}

export function formatPlanName(planType: PlanType): string {
  const normalizedPlan = getNormalizedPlan(planType);
  return NUACHA_SUBSCRIPTION_PLANS[normalizedPlan].name;
}

export function getPlan(planType: PlanType) {
  const normalizedPlan = getNormalizedPlan(planType);
  return NUACHA_SUBSCRIPTION_PLANS[normalizedPlan];
}

export function getPlanByStorageLimit(usedMB: number): PlanType | null {
  if (usedMB >= NUACHA_SUBSCRIPTION_PLANS.fully_streamlined.storageMB) {
    return null; // Needs storage add-on
  }
  if (usedMB >= NUACHA_SUBSCRIPTION_PLANS.staying_organized.storageMB) {
    return 'fully_streamlined';
  }
  if (usedMB >= NUACHA_SUBSCRIPTION_PLANS.getting_tidy.storageMB) {
    return 'staying_organized';
  }
  return 'getting_tidy';
}

export function formatStorageSize(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)}GB`;
  }
  return `${mb}MB`;
}
