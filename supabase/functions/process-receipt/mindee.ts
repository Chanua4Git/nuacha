import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

export const mindeeClient = async (apiKey: string, imageBlob: Blob) => {
  try {
    // Set up Mindee API endpoint for v5
    const endpoint = 'https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict';
    
    console.log(`📄 Processing receipt image (${Math.round(imageBlob.size / 1024)}KB)`);
    
    // Create FormData and append the image
    const formData = new FormData();
    formData.append('document', imageBlob, 'receipt.jpg');
    
    console.log('📤 Calling Mindee API with FormData...');
    
    // Make request to Mindee API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
      body: formData
    });
    
    // Get the response text first to log it and then parse it
    const responseText = await response.text();
    console.log('📥 Mindee API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.api_request?.error || errorData.message || 'Unknown Mindee API error';
        console.error('🚨 Mindee API error details:', errorData);
        throw new Error(`Mindee API Error ${response.status}: ${errorMessage}`);
      } catch (parseError) {
        console.error('🚨 Could not parse Mindee error response:', responseText);
        throw new Error(`Mindee API Error ${response.status}: ${responseText}`);
      }
    }
    
    console.log('✅ Successfully processed receipt with Mindee');
    
    const data = JSON.parse(responseText);
    
    // Map the v5 API response format - this is the key change!
    const document = data.document;
    const prediction = document.inference.prediction;
    
    // Process line items from v5 format
    const lineItems = processLineItems(prediction.line_items || []);
    
    // Calculate overall confidence from all fields
    const confidenceScores = [
      prediction.total_amount?.confidence,
      prediction.date?.confidence,
      prediction.supplier_name?.confidence
    ].filter(Boolean);
    
    const overallConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, val) => sum + val, 0) / confidenceScores.length 
      : 0.5;
    
    return {
      // Basic receipt info
      amount: {
        value: prediction.total_amount?.value,
        confidence: prediction.total_amount?.confidence
      },
      date: {
        value: prediction.date?.value,
        confidence: prediction.date?.confidence
      },
      supplier: {
        value: prediction.supplier_name?.value || prediction.supplier?.value,
        confidence: prediction.supplier_name?.confidence || prediction.supplier?.confidence
      },
      
      // Enhanced receipt details
      lineItems: lineItems,
      tax: prediction.taxes && prediction.taxes.length > 0 ? {
        amount: prediction.taxes[0].value,
        rate: prediction.taxes[0].rate,
        confidence: prediction.taxes[0].confidence || 0
      } : undefined,
      total: {
        amount: prediction.total_amount?.value,
        confidence: prediction.total_amount?.confidence || 0
      },
      subtotal: prediction.subtotal_amount ? {
        amount: prediction.subtotal_amount.value,
        confidence: prediction.subtotal_amount.confidence || 0
      } : undefined,
      storeDetails: {
        name: prediction.supplier_name?.value || prediction.supplier?.value,
        address: prediction.supplier_address?.value,
        phone: prediction.supplier_phone_number?.value,
        website: prediction.supplier_website?.value,
        confidence: prediction.supplier_name?.confidence || 0
      },
      receiptNumber: prediction.receipt_number ? {
        value: prediction.receipt_number.value,
        confidence: prediction.receipt_number.confidence || 0
      } : undefined,
      transactionTime: prediction.time ? {
        value: new Date(`${prediction.date?.value || ''} ${prediction.time.value}`),
        confidence: prediction.time.confidence || 0
      } : undefined,
      currency: prediction.currency?.value,
      paymentMethod: prediction.payment?.method ? {
        type: prediction.payment.method,
        lastDigits: prediction.payment.card_number?.split(' ').pop(),
        confidence: prediction.payment.confidence ?? 0
      } : undefined,
      confidence_summary: {
        overall: overallConfidence,
        line_items: lineItems.length > 0 ? 
          lineItems.reduce((sum, item) => sum + item.confidence, 0) / lineItems.length : 0,
        total: prediction.total_amount?.confidence || 0,
        date: prediction.date?.confidence || 0,
        merchant: prediction.supplier_name?.confidence || 0
      }
    };
  } catch (error) {
    console.error('🚨 Error in Mindee client:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error in Mindee client',
      details: error
    };
  }
}

// Process line items from Mindee v5 API response
function processLineItems(items: any[]): ReceiptLineItem[] {
  return items.map(item => ({
    description: item.description || 'Unknown item',
    quantity: item.quantity || 1,
    unitPrice: item.unit_price?.value,
    totalPrice: item.total_amount?.value || '0',
    confidence: calculateLineItemConfidence(item),
    discounted: !!item.discount,
    sku: item.product_code?.value
  }));
}

// Calculate confidence for a line item
function calculateLineItemConfidence(item: any): number {
  const confidenceValues = [
    item.confidence,
    item.description_confidence,
    item.quantity_confidence,
    item.unit_price?.confidence,
    item.total_amount?.confidence
  ].filter(Boolean);
  
  if (confidenceValues.length === 0) return 0;
  return confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
}

// Define types to be used by the mindeeClient
interface ReceiptLineItem {
  description: string;
  quantity?: number;
  unitPrice?: string;
  totalPrice: string;
  confidence: number;
  category?: string;
  discounted?: boolean;
  sku?: string;
}
