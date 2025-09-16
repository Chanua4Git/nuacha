import { Expense } from '@/types/expense';

export interface DuplicateGroup {
  id: string;
  expenses: Expense[];
  reason: 'exact_match' | 'similar_amount_date' | 'similar_description' | 'same_transaction';
  confidence: number;
}

export function detectDuplicates(expenses: Expense[]): DuplicateGroup[] {
  const duplicateGroups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  expenses.forEach((expense, index) => {
    if (processed.has(expense.id)) return;

    const potentialDuplicates = expenses.slice(index + 1).filter(other => {
      if (processed.has(other.id)) return false;
      return isDuplicateCandidate(expense, other);
    });

    if (potentialDuplicates.length > 0) {
      const allExpenses = [expense, ...potentialDuplicates];
      const { reason, confidence } = getDuplicateReason(expense, potentialDuplicates[0]);
      
      duplicateGroups.push({
        id: `duplicate-${Date.now()}-${index}`,
        expenses: allExpenses,
        reason,
        confidence
      });

      // Mark all as processed
      allExpenses.forEach(exp => processed.add(exp.id));
    }
  });

  return duplicateGroups.sort((a, b) => b.confidence - a.confidence);
}

function isDuplicateCandidate(expense1: Expense, expense2: Expense): boolean {
  // Business logic safeguards - reduce duplicate probability for different categories/types
  const categoryPenalty = expense1.category !== expense2.category ? 0.7 : 1.0;
  const expenseTypePenalty = expense1.expenseType !== expense2.expenseType ? 0.8 : 1.0;
  const combinedPenalty = categoryPenalty * expenseTypePenalty;

  // Same transaction ID (most reliable indicator)
  if (
    expense1.transactionId &&
    expense2.transactionId &&
    expense1.transactionId === expense2.transactionId
  ) {
    return true;
  }

  // Calculate description similarity (mandatory for all checks)
  const descriptionSimilarity = getEnhancedDescriptionSimilarity(expense1.description, expense2.description);
  
  // Never flag as duplicate if description similarity is too low
  if (descriptionSimilarity < 0.3) {
    return false;
  }

  // Exact match (amount, date, place) - now requires description similarity
  if (
    expense1.amount === expense2.amount &&
    expense1.date === expense2.date &&
    expense1.place.toLowerCase() === expense2.place.toLowerCase() &&
    descriptionSimilarity > 0.5
  ) {
    return true;
  }

  // Similar amount and close dates - now requires description similarity
  const amountDiff = Math.abs(expense1.amount - expense2.amount);
  const date1 = new Date(expense1.date);
  const date2 = new Date(expense2.date);
  const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));

  if (amountDiff === 0 && daysDiff <= 2 && descriptionSimilarity > 0.4 && combinedPenalty > 0.6) {
    return true;
  }

  // High description similarity with exact amount
  if (descriptionSimilarity > 0.8 && amountDiff < 0.01 && combinedPenalty > 0.7) {
    return true;
  }

  return false;
}

function getDuplicateReason(expense1: Expense, expense2: Expense): { reason: DuplicateGroup['reason']; confidence: number } {
  const descriptionSimilarity = getEnhancedDescriptionSimilarity(expense1.description, expense2.description);
  
  // Business logic factors
  const categoryPenalty = expense1.category !== expense2.category ? 0.8 : 1.0;
  const expenseTypePenalty = expense1.expenseType !== expense2.expenseType ? 0.9 : 1.0;
  const combinedPenalty = categoryPenalty * expenseTypePenalty;

  // Same transaction ID (most reliable indicator - bonus points)
  if (
    expense1.transactionId &&
    expense2.transactionId &&
    expense1.transactionId === expense2.transactionId
  ) {
    return { reason: 'same_transaction', confidence: Math.min(95, 90 + (descriptionSimilarity * 10)) };
  }

  // Exact match (amount, date, place) - now factors in description similarity
  if (
    expense1.amount === expense2.amount &&
    expense1.date === expense2.date &&
    expense1.place.toLowerCase() === expense2.place.toLowerCase()
  ) {
    const baseConfidence = 85;
    const descriptionBonus = descriptionSimilarity * 15; // Up to 15 bonus points
    const penalizedConfidence = (baseConfidence + descriptionBonus) * combinedPenalty;
    return { reason: 'exact_match', confidence: Math.round(penalizedConfidence) };
  }

  // Similar amount and date - now weighted heavily by description similarity
  const date1 = new Date(expense1.date);
  const date2 = new Date(expense2.date);
  const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
  
  if (expense1.amount === expense2.amount && daysDiff <= 2) {
    const baseConfidence = 60; // Lower base confidence
    const descriptionBonus = descriptionSimilarity * 25; // Higher weight for description
    const penalizedConfidence = (baseConfidence + descriptionBonus) * combinedPenalty;
    return { reason: 'similar_amount_date', confidence: Math.round(penalizedConfidence) };
  }

  // High description similarity with exact amount
  const amountDiff = Math.abs(expense1.amount - expense2.amount);
  if (descriptionSimilarity > 0.8 && amountDiff < 0.01) {
    const baseConfidence = 70;
    const descriptionBonus = (descriptionSimilarity - 0.8) * 50; // Bonus for very high similarity
    const penalizedConfidence = (baseConfidence + descriptionBonus) * combinedPenalty;
    return { reason: 'similar_description', confidence: Math.round(penalizedConfidence) };
  }

  // Fallback - should rarely be reached due to improved candidate filtering
  return { reason: 'similar_amount_date', confidence: Math.round(40 * combinedPenalty) };
}

function getDescriptionSimilarity(desc1: string, desc2: string): number {
  const words1 = desc1.toLowerCase().split(/\s+/);
  const words2 = desc2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Enhanced description similarity with better word filtering and semantic analysis
function getEnhancedDescriptionSimilarity(desc1: string, desc2: string): number {
  // Common stop words to ignore
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 
    'above', 'below', 'between', 'among', 'is', 'was', 'are', 'were', 'been', 'be'
  ]);

  // Normalize and filter words
  const normalizeWords = (text: string) => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .map(word => word.replace(/s$|ed$|ing$/, '')); // Basic stemming
  };

  const words1 = normalizeWords(desc1);
  const words2 = normalizeWords(desc2);

  if (words1.length === 0 && words2.length === 0) return 1.0;
  if (words1.length === 0 || words2.length === 0) return 0.0;

  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'text-red-600';
  if (confidence >= 80) return 'text-orange-600';
  if (confidence >= 70) return 'text-yellow-600';
  return 'text-blue-600';
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 90) return 'Very High';
  if (confidence >= 80) return 'High';
  if (confidence >= 70) return 'Medium';
  return 'Low';
}

export function getReasonLabel(reason: DuplicateGroup['reason']): string {
  switch (reason) {
    case 'exact_match':
      return 'Exact match (amount, date, place)';
    case 'similar_amount_date':
      return 'Same amount, similar dates';
    case 'similar_description':
      return 'Similar descriptions and amounts';
    case 'same_transaction':
      return 'Same transaction ID';
    default:
      return 'Potential duplicate';
  }
}