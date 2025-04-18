
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
        JSON.stringify({ error: 'Configuration error' }),
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

    // Validate URL is from Supabase Storage
    const projectId = 'fjrxqeyexlusjwzzecal';
    const expectedUrlPrefix = `https://${projectId}.supabase.co/storage/v1/object/public/receipts/`;
    
    if (!receiptUrl.startsWith(expectedUrlPrefix)) {
      console.error('❌ Invalid image URL. Must point to Supabase storage:', receiptUrl);
      return new Response(
        JSON.stringify({ error: 'Image URL not valid or publicly accessible' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🧾 Sending to Mindee:', receiptUrl);
    
    // Call Mindee API
    const result = await mindeeClient(apiKey, receiptUrl);

    // Return OCR results as JSON
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing receipt:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
