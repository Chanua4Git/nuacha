import { FrequencyType } from '@/types/budget';

/**
 * Convert any frequency amount to monthly equivalent
 */
export function toMonthly(amount: number, frequency: FrequencyType): number {
  switch (frequency) {
    case 'weekly':
      return amount * 4.33;
    case 'fortnightly':
      return amount * 2.165;
    case 'yearly':
      return amount / 12;
    case 'monthly':
    default:
      return amount;
  }
}

/**
 * Format amount as TTD currency
 */
export function formatTTD(amount: number): string {
  return new Intl.NumberFormat('en-TT', {
    style: 'currency',
    currency: 'TTD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get frequency display name
 */
export function getFrequencyDisplay(frequency: FrequencyType): string {
  switch (frequency) {
    case 'weekly':
      return 'Weekly';
    case 'fortnightly':
      return 'Fortnightly';
    case 'monthly':
      return 'Monthly';
    case 'yearly':
      return 'Yearly';
    default:
      return frequency;
  }
}

/**
 * Calculate percentage variance from target
 */
export function calculateVariance(actual: number, target: number): number {
  if (target === 0) return 0;
  return ((actual - target) / target) * 100;
}

/**
 * Get variance status for display
 */
export function getVarianceStatus(variance: number): 'over' | 'under' | 'on-track' {
  if (variance > 5) return 'over';
  if (variance < -5) return 'under';
  return 'on-track';
}

/**
 * Auto-categorize expense based on merchant and description
 */
export function categorizeFromReceipt(
  merchant: string,
  description: string,
  categories: Array<{ id: string; name: string; group_type: string }>
): string | null {
  const merchantLower = merchant.toLowerCase();
  const descriptionLower = description.toLowerCase();
  
  // Grocery stores - including JTA Supermarkets
  if (merchantLower.includes('grocery') || merchantLower.includes('market') || 
      merchantLower.includes('supermarket') || merchantLower.includes('foodstop') ||
      merchantLower.includes('jta') || merchantLower.includes('supermarkets')) {
    return categories.find(c => c.name === 'Groceries' && c.group_type === 'needs')?.id || null;
  }
  
  // Gas stations
  if (merchantLower.includes('gas') || merchantLower.includes('fuel') || 
      merchantLower.includes('petro') || merchantLower.includes('esso')) {
    return categories.find(c => c.name === 'Gas/Fuel' && c.group_type === 'needs')?.id || null;
  }
  
  // Pharmacies
  if (merchantLower.includes('pharmacy') || merchantLower.includes('drug') ||
      descriptionLower.includes('medicine') || descriptionLower.includes('medication')) {
    return categories.find(c => c.name === 'Medication' && c.group_type === 'needs')?.id || null;
  }
  
  // Restaurants
  if (merchantLower.includes('restaurant') || merchantLower.includes('cafe') ||
      merchantLower.includes('bar') || merchantLower.includes('kfc') ||
      merchantLower.includes('mcdonalds') || merchantLower.includes('pizza')) {
    return categories.find(c => c.name === 'Dining Out' && c.group_type === 'wants')?.id || null;
  }
  
  // Entertainment
  if (merchantLower.includes('cinema') || merchantLower.includes('movie') ||
      merchantLower.includes('theater') || merchantLower.includes('entertainment')) {
    return categories.find(c => c.name === 'Entertainment' && c.group_type === 'wants')?.id || null;
  }
  
  return null;
}

/**
 * Get month display string (e.g., "January 2024")
 */
export function getMonthDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
}

/**
 * Get first day of month as ISO string
 */
export function getFirstDayOfMonth(date: Date): string {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return firstDay.toISOString().split('T')[0];
}