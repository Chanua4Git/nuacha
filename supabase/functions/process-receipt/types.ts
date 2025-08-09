
export interface ReceiptLineItem {
  description: string;
  quantity?: number;
  unitPrice?: string;
  totalPrice: string;
  confidence: number;
  category?: string;
  discounted?: boolean;
  sku?: string;
  suggestedCategoryId?: string;
  categoryConfidence?: number;
  matchedRuleId?: string;
}

interface MindeeLineItem {
  description: string;
  quantity: number | null;
  unit_price: number | null;
  total_amount: number | null;
  confidence: number;
  discount?: boolean;
  product_code?: { value: string };
  suggestedCategoryId?: string;
  categoryConfidence?: number;
}

export interface MindeeOCRResult {
  amount?: { value: string; confidence: number };
  date?: { value: string; confidence: number };
  supplier?: { value: string; confidence: number };
  lineItems?: MindeeLineItem[];
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
  confidence?: number;
  confidence_summary?: {
    overall: number;
    line_items: number;
    total: number;
    date: number;
    merchant: number;
  };
  error?: string;
  details?: unknown;
}
