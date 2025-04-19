
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
    line_items: number;
    total: number;
    date: number;
    merchant: number;
  };
}

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

