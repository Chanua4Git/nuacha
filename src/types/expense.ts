
export interface Expense {
  id: string;
  familyId: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  place: string;
  needsReplacement?: boolean;
  replacementFrequency?: number;
  nextReplacementDate?: string;
  receiptUrl?: string;
}

export interface OCRResult {
  amount?: string;
  date?: Date;
  description?: string;
  place?: string;
  confidence?: number;
  error?: string;  // Added error property
}
