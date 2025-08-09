
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { mapPredictionToResult } from './prediction-mapper.ts';
import { MindeeOCRResult } from './types.ts';

export const mindeeClient = async (apiKey: string, imageBlob: Blob): Promise<MindeeOCRResult> => {
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
    const document = data.document;
    const prediction = document.inference.prediction;
    
    return mapPredictionToResult(prediction, document);
    
  } catch (error) {
    console.error('🚨 Error in Mindee client:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error in Mindee client',
      details: error
    };
  }
}
