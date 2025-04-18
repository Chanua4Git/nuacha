
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { mindeeClient } from './mindee.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  receiptUrl: string;
}

type ErrorResponse = {
  error: string;
  type: 'UPLOAD_ERROR' | 'SERVER_ERROR' | 'OCR_CONFIDENCE_LOW' | 'IMAGE_FORMAT_ERROR' | 'FETCH_ERROR';
  details?: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('MINDEE_API_KEY');
    if (!apiKey) {
      console.error('❌ Missing Mindee API key');
      return new Response(
        JSON.stringify({
          error: "We're experiencing technical difficulties with our receipt processing service",
          type: 'SERVER_ERROR',
          details: 'Configuration error: Missing API key'
        } as ErrorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { receiptUrl } = await req.json() as RequestBody;
    
    if (!receiptUrl) {
      console.error('❌ Missing receipt URL');
      return new Response(
        JSON.stringify({
          error: "We couldn't find the receipt image",
          type: 'UPLOAD_ERROR',
          details: 'Missing receipt URL'
        } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanUrl = receiptUrl.split('?')[0];
    const projectId = 'fjrxqeyexlusjwzzecal';
    const expectedUrlPrefix = `https://${projectId}.supabase.co/storage/v1/object/public/receipts/`;
    
    if (!cleanUrl.startsWith(expectedUrlPrefix)) {
      console.error('❌ Invalid image URL. Must point to Supabase storage:', cleanUrl);
      return new Response(
        JSON.stringify({
          error: "We're having trouble accessing your receipt image",
          type: 'FETCH_ERROR',
          details: 'Image URL not valid or publicly accessible'
        } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🧾 Processing receipt from:', cleanUrl);
    
    const result = await mindeeClient(apiKey, cleanUrl);
    
    if ('error' in result) {
      console.error('🚨 Error processing receipt:', result.error);
      
      // Determine error type based on the error message
      let errorResponse: ErrorResponse;
      
      if (result.error.includes('fetch image')) {
        errorResponse = {
          error: "We're having trouble accessing this image. Could you try uploading it again?",
          type: 'FETCH_ERROR',
          details: result.error
        };
      } else if (result.error.includes('format')) {
        errorResponse = {
          error: "This image format isn't compatible. Please upload a JPEG or PNG file.",
          type: 'IMAGE_FORMAT_ERROR',
          details: result.error
        };
      } else {
        errorResponse = {
          error: "We're experiencing technical difficulties processing receipts right now.",
          type: 'SERVER_ERROR',
          details: result.error
        };
      }
      
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check OCR confidence
    if (result.confidence && result.confidence < 0.3) {
      return new Response(
        JSON.stringify({
          error: "The text in this receipt is a bit hard to read. Would you like to enter the details manually?",
          type: 'OCR_CONFIDENCE_LOW',
          confidence: result.confidence,
          data: result // Still return the data for manual verification
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Successfully processed receipt with Mindee');
    
    return new Response(
      JSON.stringify({
        ...result,
        confidence: result.confidence || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('🚨 Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: "Something unexpected happened while processing your receipt",
        type: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      } as ErrorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
