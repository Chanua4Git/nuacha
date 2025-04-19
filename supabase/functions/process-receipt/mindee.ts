
// code for handling mindee API
export const mindeeClient = async (apiKey: string, imageBlob: Blob) => {
  try {
    // Set up Mindee API endpoint for v4
    const endpoint = 'https://api.mindee.net/v1/products/mindee/expense_receipts/v4/predict';
    
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
    
    // Map the v4 API response format
    const document = data.document.inference.prediction;
    const lineItems = processLineItems(document.line_items || []);
    
    return {
      // Basic receipt info
      amount: {
        value: document.total_amount?.value,
        confidence: document.total_amount?.confidence
      },
      date: {
        value: document.date?.value,
        confidence: document.date?.confidence
      },
      supplier: {
        value: document.merchant_name?.value,
        confidence: document.merchant_name?.confidence
      },
      
      // Enhanced receipt details
      lineItems: lineItems,
      tax: document.taxes && document.taxes.length > 0 ? {
        amount: document.taxes[0].value,
        rate: document.taxes[0].rate,
        confidence: document.taxes[0].confidence || 0
      } : undefined,
      total: {
        amount: document.total_amount?.value,
        confidence: document.total_amount?.confidence || 0
      },
      subtotal: document.subtotal_amount ? {
        amount: document.subtotal_amount.value,
        confidence: document.subtotal_amount.confidence || 0
      } : undefined,
      storeDetails: {
        name: document.merchant_name?.value,
        address: document.merchant_address?.value,
        phone: document.merchant_phone?.value,
        website: document.merchant_website?.value,
        confidence: document.merchant_name?.confidence || 0
      },
      receiptNumber: document.receipt_number ? {
        value: document.receipt_number.value,
        confidence: document.receipt_number.confidence || 0
      } : undefined,
      transactionTime: document.time ? {
        value: new Date(`${document.date?.value || ''} ${document.time.value}`),
        confidence: document.time.confidence || 0
      } : undefined,
      currency: document.currency?.value,
      paymentMethod: document.payment_details ? {
        type: document.payment_details.method || 'unknown',
        lastDigits: document.payment_details.card_number?.split(' ').pop(),
        confidence: document.payment_details.confidence || 0
      } : undefined,
      confidence_summary: {
        overall: calculateOverallConfidence(document),
        line_items: lineItems.length > 0 ? 
          lineItems.reduce((sum, item) => sum + item.confidence, 0) / lineItems.length : 0,
        total: document.total_amount?.confidence || 0,
        date: document.date?.confidence || 0,
        merchant: document.merchant_name?.confidence || 0
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

// Process line items from Mindee API response
function processLineItems(items: any[]): ReceiptLineItem[] {
  return items.map(item => ({
    description: item.description || 'Unknown item',
    quantity: item.quantity || 1,
    unitPrice: item.unit_price,
    totalPrice: item.total_amount || '0',
    confidence: calculateLineItemConfidence(item),
    discounted: !!item.discount,
    sku: item.product_code
  }));
}

// Calculate confidence for a line item
function calculateLineItemConfidence(item: any): number {
  const confidenceValues = [
    item.confidence,
    item.description_confidence,
    item.quantity_confidence,
    item.unit_price_confidence,
    item.total_amount_confidence
  ].filter(Boolean);
  
  if (confidenceValues.length === 0) return 0;
  return confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
}

// Helper function to calculate overall confidence from the Mindee response
function calculateOverallConfidence(document: any): number {
  const confidenceValues = [
    document.total_amount_confidence,
    document.date_confidence,
    document.merchant_name_confidence
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
