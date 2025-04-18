
// Mindee API client for Deno/Edge Function

export async function mindeeClient(apiKey: string, receiptUrl: string) {
  try {
    // Set up Mindee API endpoint and headers
    const endpoint = 'https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict';
    
    const headers = {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    console.log('📤 Calling Mindee API with URL:', receiptUrl);
    
    // Make request to Mindee API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ document: receiptUrl })
    });
    
    const responseText = await response.text();
    console.log('📥 Mindee API response:', responseText);
    
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.api_request?.error || errorData.message || 'Unknown Mindee API error';
        throw new Error(`Mindee API Error ${response.status}: ${errorMessage}`);
      } catch (parseError) {
        throw new Error(`Mindee API Error ${response.status}: ${responseText}`);
      }
    }
    
    const data = JSON.parse(responseText);
    
    // Extract and map the relevant information
    const document = data.document.inference.prediction;
    
    return {
      amount: {
        value: document.total_amount?.value,
        confidence: document.total_amount?.confidence
      },
      date: {
        value: document.date?.value,
        confidence: document.date?.confidence
      },
      supplier: {
        value: document.supplier?.value,
        confidence: document.supplier?.confidence
      },
      merchant_name: {
        value: document.supplier_name?.value,
        confidence: document.supplier_name?.confidence
      },
      line_items: document.line_items?.map((item: any) => ({
        description: item.description?.value,
        amount: item.total_amount?.value,
        confidence: Math.min(item.description?.confidence || 0, item.total_amount?.confidence || 0)
      })),
      confidence: calculateOverallConfidence(document)
    };
  } catch (error) {
    console.error('Error in Mindee client:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error in Mindee client'
    };
  }
}

// Helper function to calculate overall confidence from the Mindee response
function calculateOverallConfidence(document: any): number {
  const confidenceValues = [
    document.total_amount?.confidence,
    document.date?.confidence,
    document.supplier?.confidence
  ].filter(Boolean);
  
  if (confidenceValues.length === 0) return 0;
  
  return confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
}
