import { useState, useCallback } from 'react';
import { useExpenses } from './useExpenses';
import { detectDuplicates, DuplicateGroup } from '@/utils/duplicateDetection';
import { OCRResult, Expense } from '@/types/expense';

// Helper to check if a string is a valid UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export interface ReceiptDuplicateCheck {
  hasDuplicates: boolean;
  duplicateGroups: DuplicateGroup[];
  potentialExpense: Partial<Expense>;
}

export const useReceiptDuplicateDetection = (familyId?: string) => {
  // Only fetch expenses if familyId is a valid UUID (skip for demo)
  const shouldFetchExpenses = familyId && isValidUUID(familyId);
  const { expenses } = useExpenses({ familyId: shouldFetchExpenses ? familyId : undefined });
  const [isChecking, setIsChecking] = useState(false);

  const checkForReceiptDuplicates = useCallback(async (
    ocrResult: OCRResult,
    familyId: string,
    amount: string,
    description: string,
    place: string,
    date: Date
  ): Promise<ReceiptDuplicateCheck> => {
    setIsChecking(true);
    
    try {
      // Create a potential expense based on OCR data and form input
      const potentialExpense: Partial<Expense> = {
        familyId,
        amount: parseFloat(amount),
        description,
        place,
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        transactionId: ocrResult.receiptNumber?.value || undefined,
      };

      // Add the potential expense to the existing expenses array for duplicate detection
      const expensesWithPotential = [
        ...expenses,
        potentialExpense as Expense
      ];

      // Run duplicate detection
      const duplicateGroups = detectDuplicates(expensesWithPotential);
      
      // Filter to only groups that include our potential expense (it would be the last one)
      const relevantGroups = duplicateGroups.filter(group => 
        group.expenses.some(exp => 
          exp.amount === potentialExpense.amount &&
          exp.description === potentialExpense.description &&
          exp.place === potentialExpense.place &&
          exp.date === potentialExpense.date
        )
      );

      return {
        hasDuplicates: relevantGroups.length > 0,
        duplicateGroups: relevantGroups,
        potentialExpense
      };
    } finally {
      setIsChecking(false);
    }
  }, [expenses]);

  const checkForReceiptDuplicatesAdvanced = useCallback(async (
    ocrResult: OCRResult,
    familyId: string,
    amount: string,
    description: string,
    place: string,
    date: Date
  ): Promise<ReceiptDuplicateCheck> => {
    setIsChecking(true);
    
    try {
      const potentialAmount = parseFloat(amount);
      const potentialDate = date.toISOString().split('T')[0];
      
      // Enhanced duplicate detection for receipts
      const potentialDuplicates = expenses.filter(expense => {
        // Exact match check
        if (
          expense.amount === potentialAmount &&
          expense.date === potentialDate &&
          expense.place.toLowerCase() === place.toLowerCase()
        ) {
          return true;
        }

        // Receipt number match (if available)
        if (
          ocrResult.receiptNumber?.value &&
          expense.transactionId === ocrResult.receiptNumber.value
        ) {
          return true;
        }

        // Vendor name + amount + similar date (within 2 days)
        if (
          expense.amount === potentialAmount &&
          ocrResult.storeDetails?.name &&
          expense.place.toLowerCase().includes(ocrResult.storeDetails.name.toLowerCase())
        ) {
          const expenseDate = new Date(expense.date);
          const potentialDateObj = new Date(potentialDate);
          const daysDiff = Math.abs((expenseDate.getTime() - potentialDateObj.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 2) {
            return true;
          }
        }

        // Very similar description and amount
        const descriptionSimilarity = getTextSimilarity(expense.description, description);
        if (
          descriptionSimilarity > 0.8 &&
          Math.abs(expense.amount - potentialAmount) < 0.01
        ) {
          return true;
        }

        return false;
      });

      if (potentialDuplicates.length > 0) {
        // Create duplicate groups
        const duplicateGroup: DuplicateGroup = {
          id: `receipt-duplicate-${Date.now()}`,
          expenses: potentialDuplicates,
          reason: ocrResult.receiptNumber?.value ? 'same_transaction' : 'exact_match',
          confidence: ocrResult.receiptNumber?.value ? 90 : 85
        };

        return {
          hasDuplicates: true,
          duplicateGroups: [duplicateGroup],
          potentialExpense: {
            familyId,
            amount: potentialAmount,
            description,
            place,
            date: potentialDate,
            transactionId: ocrResult.receiptNumber?.value || undefined,
          }
        };
      }

      return {
        hasDuplicates: false,
        duplicateGroups: [],
        potentialExpense: {
          familyId,
          amount: potentialAmount,
          description,
          place,
          date: potentialDate,
          transactionId: ocrResult.receiptNumber?.value || undefined,
        }
      };
    } finally {
      setIsChecking(false);
    }
  }, [expenses]);

  return {
    checkForReceiptDuplicates: checkForReceiptDuplicatesAdvanced,
    isChecking
  };
};

// Helper function for text similarity
function getTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}