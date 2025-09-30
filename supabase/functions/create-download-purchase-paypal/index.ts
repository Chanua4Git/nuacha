import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, userEmail, userName } = await req.json();

    // Create Supabase client with service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get product details
    const { data: product, error: productError } = await supabaseService
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      console.error('Product fetch error:', productError);
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create PayPal order using OAuth2 Bearer flow
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalClientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const paypalEnv = (Deno.env.get("PAYPAL_ENV") || "sandbox").toLowerCase();
    const baseUrl = paypalEnv === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
    
    // Debug logging
    console.log('PayPal ENV:', paypalEnv);
    console.log('PayPal Base URL:', baseUrl);
    console.log('PayPal Client ID length:', paypalClientId?.length || 0);
    console.log('PayPal Client Secret length:', paypalClientSecret?.length || 0);
    console.log('PayPal Client ID exists:', !!paypalClientId);
    console.log('PayPal Client Secret exists:', !!paypalClientSecret);
    
    if (!paypalClientId || !paypalClientSecret) {
      console.error('Missing PayPal client credentials');
      return new Response(JSON.stringify({ error: 'paypal_credentials_missing' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 1) Obtain OAuth2 access token
    const basicAuth = btoa(`${paypalClientId}:${paypalClientSecret}`);
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    console.log('PayPal Token Response Status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const tokenBody = await tokenResponse.text();
      console.error('PayPal token error', tokenResponse.status, tokenBody);
      return new Response(JSON.stringify({ error: 'paypal_oauth_failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const tokenJson = await tokenResponse.json();
    const accessToken = tokenJson.access_token;
    
    // 2) Create order with Bearer token
    const paypalRequestBody = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: product.price_usd.toString(),
        },
        description: product.name,
      }],
      application_context: {
        return_url: `${req.headers.get("origin")}/download-purchase-success`,
        cancel_url: `${req.headers.get("origin")}/authentication-demo`,
      },
    };
    
    console.log('PayPal request body:', JSON.stringify(paypalRequestBody, null, 2));
    const paypalOrderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(paypalRequestBody),
    });
    
    console.log('PayPal API Response Status:', paypalOrderResponse.status);
    console.log('PayPal API Response Headers:', Object.fromEntries(paypalOrderResponse.headers));
    
    const paypalOrder = await paypalOrderResponse.json();
    console.log('PayPal API Response Body:', JSON.stringify(paypalOrder, null, 2));
    
    if (!paypalOrderResponse.ok) {
      const orderBody = await paypalOrderResponse.text();
      console.error('PayPal order error', paypalOrderResponse.status, orderBody);
      return new Response(JSON.stringify({ error: 'paypal_order_failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate order reference
    const orderReference = `GO-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Store purchase record
    const { error: purchaseError } = await supabaseService
      .from('download_purchases')
      .insert({
        product_id: productId,
        user_email: userEmail,
        user_name: userName,
        payment_method: 'paypal',
        amount: product.price_usd,
        currency: 'USD',
        status: 'pending_paypal',
        order_reference: orderReference,
        paypal_order_id: paypalOrder.id,
        download_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      });

    if (purchaseError) {
      console.error('Purchase record creation failed:', purchaseError);
      return new Response(JSON.stringify({ error: 'Failed to create purchase record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const approvalUrl = paypalOrder.links.find((link: any) => link.rel === 'approve')?.href;

    return new Response(JSON.stringify({ 
      orderId: paypalOrder.id,
      approvalUrl,
      orderReference 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-download-purchase-paypal:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});