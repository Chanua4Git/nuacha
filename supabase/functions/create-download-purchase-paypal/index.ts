import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Create PayPal order
    const paypalAuth = btoa(`${Deno.env.get("PAYPAL_CLIENT_ID")}:${Deno.env.get("PAYPAL_CLIENT_SECRET")}`);
    
    const paypalOrderResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${paypalAuth}`,
      },
      body: JSON.stringify({
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
      }),
    });

    const paypalOrder = await paypalOrderResponse.json();

    if (!paypalOrderResponse.ok) {
      console.error('PayPal order creation failed:', paypalOrder);
      return new Response(JSON.stringify({ error: 'PayPal order creation failed' }), {
        status: 500,
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});