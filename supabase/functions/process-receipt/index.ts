
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { mindeeClient } from './mindee.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  receiptUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Mindee API key from env vars
    const apiKey = Deno.env.get('MINDEE_API_KEY');
    if (!apiKey) {
      console.error('❌ Missing Mindee API key');
      return new Response(
        JSON.stringify({ error: 'Configuration error: Missing API key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { receiptUrl } = await req.json() as RequestBody;
    
    if (!receiptUrl) {
      console.error('❌ Missing receipt URL');
      return new Response(
        JSON.stringify({ error: 'Missing receipt URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove any query parameters from the URL
    const cleanUrl = receiptUrl.split('?')[0];

    // Validate URL is from Supabase Storage
    const projectId = 'fjrxqeyexlusjwzzecal';
    const expectedUrlPrefix = `https://${projectId}.supabase.co/storage/v1/object/public/receipts/`;
    
    if (!cleanUrl.startsWith(expectedUrlPrefix)) {
      console.error('❌ Invalid image URL. Must point to Supabase storage:', cleanUrl);
      return new Response(
        JSON.stringify({ error: 'Image URL not valid or publicly accessible' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🧾 Processing receipt from:', cleanUrl);
    
    // Fetch the image from Supabase Storage
    const imageResponse = await fetch(cleanUrl);
    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error(`❌ Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
      console.error('Response text:', errorText);
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    // Get the image as a blob
    const imageBlob = await imageResponse.blob();
    console.log(`📄 Retrieved image (${Math.round(imageBlob.size / 1024)}KB)`);
    
    // Create FormData for Mindee
    const formData = new FormData();
    formData.append('document', imageBlob, 'receipt.jpg');
    
    console.log('📤 Calling Mindee API...');
    
    // Call Mindee API
    const endpoint = 'https://api.mindee.net/v1/products/mindee/expense_receipts/v4/predict';
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
    
    return new Response(
      JSON.stringify({
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
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('🚨 Error processing receipt:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

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
