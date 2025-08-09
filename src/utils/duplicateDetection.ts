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
  // Exact match (amount, date, place)
  if (
    expense1.amount === expense2.amount &&
    expense1.date === expense2.date &&
    expense1.place.toLowerCase() === expense2.place.toLowerCase()
  ) {
    return true;
  }

  // Same transaction ID
  if (
    expense1.transactionId &&
    expense2.transactionId &&
    expense1.transactionId === expense2.transactionId
  ) {
    return true;
  }

  // Similar amount and close dates
  const amountDiff = Math.abs(expense1.amount - expense2.amount);
  const date1 = new Date(expense1.date);
  const date2 = new Date(expense2.date);
  const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));

  if (amountDiff === 0 && daysDiff <= 2) {
    return true;
  }

  // Similar description and amount
  const similarity = getDescriptionSimilarity(expense1.description, expense2.description);
  if (similarity > 0.8 && amountDiff < 0.01) {
    return true;
  }

  return false;
}

function getDuplicateReason(expense1: Expense, expense2: Expense): { reason: DuplicateGroup['reason']; confidence: number } {
  // Exact match
  if (
    expense1.amount === expense2.amount &&
    expense1.date === expense2.date &&
    expense1.place.toLowerCase() === expense2.place.toLowerCase()
  ) {
    return { reason: 'exact_match', confidence: 95 };
  }

  // Same transaction ID
  if (
    expense1.transactionId &&
    expense2.transactionId &&
    expense1.transactionId === expense2.transactionId
  ) {
    return { reason: 'same_transaction', confidence: 90 };
  }

  // Similar amount and date
  const date1 = new Date(expense1.date);
  const date2 = new Date(expense2.date);
  const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
  
  if (expense1.amount === expense2.amount && daysDiff <= 2) {
    return { reason: 'similar_amount_date', confidence: 85 };
  }

  // Similar description
  const similarity = getDescriptionSimilarity(expense1.description, expense2.description);
  if (similarity > 0.8) {
    return { reason: 'similar_description', confidence: 75 };
  }

  return { reason: 'similar_amount_date', confidence: 60 };
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