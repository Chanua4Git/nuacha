
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
        JSON.stringify({ 
          error: "We're having trouble accessing our receipt processing service",
          details: 'Configuration error: Missing API key'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { receiptUrl } = await req.json() as RequestBody;
    
    if (!receiptUrl) {
      console.error('❌ Missing receipt URL');
      return new Response(
        JSON.stringify({ 
          error: "We couldn't find the receipt image",
          details: 'Missing receipt URL'
        }),
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
        JSON.stringify({ 
          error: "We're having trouble accessing your receipt image",
          details: 'Image URL not valid or publicly accessible'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🧾 Processing receipt from:', cleanUrl);
    
    const result = await mindeeClient(apiKey, cleanUrl);
    
    if ('error' in result) {
      console.error('🚨 Error processing receipt:', result.error);
      return new Response(
        JSON.stringify({ 
          error: "We weren't able to read your receipt clearly",
          details: result.error
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Successfully processed receipt with Mindee');
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('🚨 Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: "Something unexpected happened while processing your receipt",
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
