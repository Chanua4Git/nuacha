
import { OCRResult } from '@/types/expense';

export type ReceiptImageError = {
  message: string;
  type: 'UPLOAD_ERROR' | 'SERVER_ERROR' | 'OCR_CONFIDENCE_LOW' | 'IMAGE_FORMAT_ERROR' | 'FETCH_ERROR';
};

export type MindeeResponse = {
  amount?: { value: string; confidence: number };
  date?: { value: string; confidence: number };
  supplier?: { value: string; confidence: number };
  line_items?: Array<{
    description: string;
    amount: number;
    confidence: number;
  }>;
  confidence?: number;
};
