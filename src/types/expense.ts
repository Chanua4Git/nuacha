
// Family type
export interface Family {
  id: string;
  name: string;
  color: string;
}

// Category type
export interface Category {
  id: string;
  name: string;
  color: string;
  family_id?: string; // If null, it's a general category
  parent_id?: string; // Parent category id for hierarchical categories
  budget?: number; // Optional budget for the category
  description?: string; // Optional description
  icon?: string; // Optional icon identifier
  created_at?: string;
}

// Expense type
export interface Expense {
  id: string;
  familyId: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  place: string;
  needsReplacement?: boolean;
  replacementFrequency?: number; // in days
  nextReplacementDate?: string;
  receiptUrl?: string;
  taxAmount?: number;
  isTaxDeductible?: boolean;
  paymentMethod?: string;
  tags?: string[];
  transactionId?: string;
}

// For backward compatibility and consistent casing in our application
export interface CategoryWithCamelCase {
  id: string;
  name: string;
  color: string;
  familyId?: string;
  parentId?: string;
  budget?: number;
  description?: string;
  icon?: string;
  createdAt?: string;
}

// OCR result type
export interface OCRResult {
  amount?: string;
  date?: Date;
  description?: string;
  place?: string;
  confidence?: number;
  error?: string;
  type?: 'UPLOAD_ERROR' | 'SERVER_ERROR' | 'OCR_CONFIDENCE_LOW' | 'IMAGE_FORMAT_ERROR' | 'FETCH_ERROR';
  
  // Enhanced receipt details
  lineItems?: ReceiptLineItem[];
  tax?: {
    amount: string;
    rate?: string;
    confidence: number;
  };
  total?: {
    amount: string;
    confidence: number;
  };
  subtotal?: {
    amount: string;
    confidence: number;
  };
  discount?: {
    amount: string;
    description?: string;
    confidence: number;
  };
  paymentMethod?: {
    type: string;
    lastDigits?: string;
    confidence: number;
  };
  storeDetails?: {
    name: string;
    address?: string;
    phone?: string;
    website?: string;
    confidence: number;
  };
  receiptNumber?: {
    value: string;
    confidence: number;
  };
  transactionTime?: {
    value: Date;
    confidence: number;
  };
  currency?: string;
  confidence_summary?: {
    overall: number;
    line_items: number; // Using snake_case to match the API response
    total: number;
    date: number;
    merchant: number;
  };
}

// Update ReceiptLineItem definition to match what we use in the app
export interface ReceiptLineItem {
  description: string;
  quantity?: number;
  totalPrice: string;
  confidence: number;
  category?: string;
  discounted?: boolean;
  sku?: string;
  suggestedCategoryId?: string;
  categoryConfidence?: number;
}
