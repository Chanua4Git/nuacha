
// Mindee API client for Deno/Edge Function

export async function mindeeClient(apiKey: string, receiptUrl: string) {
  try {
    // Set up Mindee API endpoint and headers for v4
    const endpoint = 'https://api.mindee.net/v1/products/mindee/expense_receipts/v4/predict';
    
    console.log('📥 Fetching receipt from URL:', receiptUrl);
    
    // First fetch the image from the Supabase URL
    const imageResponse = await fetch(receiptUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    // Get the image blob
    const imageBlob = await imageResponse.blob();
    
    // Create FormData and append the image
    const formData = new FormData();
    formData.append('document', imageBlob);
    
    console.log('📤 Calling Mindee API...');
    
    // Make request to Mindee API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        // Let fetch set the content-type for FormData
      },
      body: formData
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
    
    // Map the v4 API response format
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
        value: document.merchant_name?.value,
        confidence: document.merchant_name?.confidence
      },
      line_items: document.line_items?.map((item: any) => ({
        description: item.description,
        amount: item.total_amount,
        confidence: Math.min(
          item.confidence || 0, 
          item.total_amount_confidence || 0
        )
      })),
      confidence: calculateOverallConfidence(document)
    };
  } catch (error) {
    console.error('🚨 Error in Mindee client:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error in Mindee client',
      details: error
    };
  }
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
