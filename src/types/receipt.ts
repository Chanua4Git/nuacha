
import { CategoryWithCamelCase } from './expense';

export interface ReceiptLineItem {
  id?: string;
  expenseId: string;
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
  categoryId?: string;
  suggestedCategoryId?: string;
  categoryConfidence?: number;
  sku?: string;
  discount?: boolean;
  createdAt?: string;
  
  // UI-only properties
  isEditing?: boolean;
  category?: CategoryWithCamelCase | null;
  suggestedCategory?: CategoryWithCamelCase | null;
}

export interface ReceiptDetail {
  id?: string;
  expenseId: string;
  rawData?: any;
  vendorName?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  vendorWebsite?: string;
  receiptNumber?: string;
  transactionTime?: string;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  paymentMethod?: string;
  currency?: string;
  confidenceSummary?: {
    overall: number;
    lineItems: number;
    total: number;
    date: number;
    merchant: number;
  };
  createdAt?: string;
}

export interface CategorizationRule {
  id?: string;
  userId: string;
  name: string;
  pattern: string;
  patternType: 'vendor' | 'item' | 'description';
  categoryId: string;
  priority?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  
  // UI-only properties
  category?: CategoryWithCamelCase;
}

export interface CategorySuggestion {
  categoryId: string;
  confidence: number;
  matchedRule?: CategorizationRule;
}

export interface LineItemWithSuggestions extends ReceiptLineItem {
  suggestions?: CategorySuggestion[];
}
