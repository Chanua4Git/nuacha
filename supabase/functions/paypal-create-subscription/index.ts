import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!
    
    // Get the user from the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      console.error('User authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { planId } = await req.json()

    if (!planId) {
      return new Response(
        JSON.stringify({ error: 'Plan ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get PayPal credentials
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID')
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
    const paypalApiBase = 'https://api-m.sandbox.paypal.com' // Use sandbox for testing

    if (!clientId || !clientSecret) {
      console.error('PayPal credentials not configured')
      return new Response(
        JSON.stringify({ error: 'PayPal not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get PayPal access token
    const tokenResponse = await fetch(`${paypalApiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      console.error('Failed to get PayPal token:', await tokenResponse.text())
      return new Response(
        JSON.stringify({ error: 'PayPal authentication failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get subscription plan details from database
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      console.error('Plan not found:', planError)
      return new Response(
        JSON.stringify({ error: 'Subscription plan not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create PayPal subscription
    const subscriptionPayload = {
      plan_id: planId, // This should match a PayPal plan ID
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Start tomorrow
      subscriber: {
        email_address: user.email
      },
      application_context: {
        brand_name: "Nuacha Payroll",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
        },
        return_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/paypal-subscription-success`,
        cancel_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/paypal-subscription-cancel`
      }
    }

    const subscriptionResponse = await fetch(`${paypalApiBase}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': crypto.randomUUID()
      },
      body: JSON.stringify(subscriptionPayload)
    })

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text()
      console.error('PayPal subscription creation failed:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to create PayPal subscription' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const subscriptionData = await subscriptionResponse.json()
    console.log('PayPal subscription created:', subscriptionData)

    // Store pending subscription in database
    const { error: dbError } = await supabaseClient
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        subscription_plan_id: planId,
        paypal_subscription_id: subscriptionData.id,
        status: 'pending'
      })

    if (dbError) {
      console.error('Failed to store subscription:', dbError)
      // Continue anyway, as PayPal subscription was created
    }

    // Get approval URL
    const approvalUrl = subscriptionData.links?.find((link: any) => link.rel === 'approve')?.href

    if (!approvalUrl) {
      console.error('No approval URL found in PayPal response')
      return new Response(
        JSON.stringify({ error: 'Invalid PayPal response' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        subscriptionId: subscriptionData.id,
        approvalUrl: approvalUrl
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating PayPal subscription:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})