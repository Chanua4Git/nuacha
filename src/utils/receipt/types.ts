
import { OCRResult } from '@/types/expense';

export type ReceiptImageError = {
  message: string;
  type: 'UPLOAD_ERROR' | 'SERVER_ERROR' | 'OCR_CONFIDENCE_LOW' | 'IMAGE_FORMAT_ERROR' | 'FETCH_ERROR';
};

export type MindeeResponse = {
  amount?: { value: string; confidence: number };
  date?: { value: string; confidence: number };
  supplier?: { value: string; confidence: number };
  lineItems?: any[];
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
  confidence?: number;
  confidence_summary?: {
    overall: number;
    line_items: number;
    total: number;
    date: number;
    merchant: number;
  };
  error?: string;
  type?: string;
};
