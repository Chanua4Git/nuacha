
// Follow these steps to make this Edge Function work once Supabase is connected:
// 1. Deploy this function to your Supabase project
// 2. Set the MINDEE_API_KEY in your Supabase project's secrets
//    (supabase secrets set MINDEE_API_KEY=your_api_key)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { mindeeClient } from './mindee.ts';

// This interface defines the shape of the request body
interface RequestBody {
  receiptUrl: string;
}

serve(async (req) => {
  try {
    // Get Mindee API key from env vars (set in Supabase secrets)
    const apiKey = Deno.env.get('MINDEE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { receiptUrl } = await req.json() as RequestBody;
    
    if (!receiptUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing receipt URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call Mindee API
    const result = await mindeeClient(apiKey, receiptUrl);

    // Return OCR results as JSON
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing receipt:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
