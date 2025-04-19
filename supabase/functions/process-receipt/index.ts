
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { mindeeClient } from './mindee.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const mindeeApiKey = Deno.env.get('MINDEE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!mindeeApiKey) {
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

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase credentials for admin access');
      return new Response(
        JSON.stringify({
          error: "We're experiencing technical difficulties with our receipt processing service",
          type: 'SERVER_ERROR',
          details: 'Configuration error: Missing Supabase admin credentials'
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

    // Extract the path from the URL
    // Example URL: https://fjrxqeyexlusjwzzecal.supabase.co/storage/v1/object/public/receipts/userId/timestamp.jpg
    const projectId = 'fjrxqeyexlusjwzzecal';
    const expectedUrlPrefix = `https://${projectId}.supabase.co/storage/v1/object/public/receipts/`;
    
    if (!receiptUrl.startsWith(expectedUrlPrefix)) {
      console.error('❌ Invalid image URL. Must point to Supabase storage:', receiptUrl);
      return new Response(
        JSON.stringify({
          error: "We're having trouble accessing your receipt image",
          type: 'FETCH_ERROR',
          details: 'Image URL not valid or publicly accessible'
        } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the path from the URL by removing the prefix and any query parameters
    const receiptPath = receiptUrl
      .replace(expectedUrlPrefix, '')
      .split('?')[0]; // Remove any query parameters
    
    console.log('🧾 Processing receipt path:', receiptPath);
    
    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Download the image directly using the Supabase Admin Client
    const { data: imageData, error: downloadError } = await supabaseAdmin.storage
      .from('receipts')
      .download(receiptPath);
    
    if (downloadError || !imageData) {
      console.error('❌ Error downloading receipt from storage:', downloadError);
      return new Response(
        JSON.stringify({
          error: "We couldn't access your receipt image",
          type: 'FETCH_ERROR',
          details: downloadError?.message || 'Unknown error accessing image'
        } as ErrorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📄 Downloaded image (${Math.round(imageData.size / 1024)}KB)`);
    
    // Process the image using Mindee
    const result = await mindeeClient(mindeeApiKey, imageData);
    
    if ('error' in result) {
      console.error('🚨 Error processing receipt:', result.error);
      
      // Determine error type based on the error message
      let errorResponse: ErrorResponse;
      
      if (result.error.includes('fetch image')) {
        errorResponse = {
          error: "We're having trouble processing this image. Could you try uploading it again?",
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
