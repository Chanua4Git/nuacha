
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
