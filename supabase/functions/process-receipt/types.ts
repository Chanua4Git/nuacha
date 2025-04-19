
export interface ReceiptLineItem {
  description: string;
  quantity?: number;
  unitPrice?: string;
  totalPrice: string;
  confidence: number;
  category?: string;
  discounted?: boolean;
  sku?: string;
}

export interface MindeeOCRResult {
  amount?: { value: string; confidence: number };
  date?: { value: string; confidence: number };
  supplier?: { value: string; confidence: number };
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
