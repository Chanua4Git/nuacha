import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Set auth for supabase client
    supabase.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: ''
    })

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { payrollPeriodId, amount } = await req.json()

    if (!payrollPeriodId || !amount) {
      throw new Error('Missing payrollPeriodId or amount')
    }

    // Verify user owns the payroll period
    const { data: payrollPeriod, error: periodError } = await supabase
      .from('payroll_periods')
      .select('*')
      .eq('id', payrollPeriodId)
      .eq('user_id', user.id)
      .single()

    if (periodError || !payrollPeriod) {
      throw new Error('Payroll period not found or unauthorized')
    }

    // Create PayPal order
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID')
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
    
    if (!paypalClientId || !paypalClientSecret) {
      throw new Error('PayPal credentials not configured')
    }

    // Get PayPal access token
    const authResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    })

    const authData = await authResponse.json()
    
    if (!authResponse.ok) {
      console.error('PayPal auth error:', authData)
      throw new Error('Failed to authenticate with PayPal')
    }

    // Create order
    const orderResponse = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`,
        'PayPal-Request-Id': `${payrollPeriodId}-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amount.toString()
          },
          description: `Payroll processing for period ${payrollPeriod.name}`,
          custom_id: payrollPeriodId
        }],
        application_context: {
          return_url: `${req.headers.get('origin')}/payroll?success=true`,
          cancel_url: `${req.headers.get('origin')}/payroll?cancelled=true`,
          brand_name: 'Nuacha Payroll',
          user_action: 'PAY_NOW'
        }
      })
    })

    const orderData = await orderResponse.json()
    
    if (!orderResponse.ok) {
      console.error('PayPal order creation error:', orderData)
      throw new Error('Failed to create PayPal order')
    }

    // Save payment record
    const { error: paymentError } = await supabase
      .from('paypal_payments')
      .insert({
        user_id: user.id,
        payroll_period_id: payrollPeriodId,
        amount: amount,
        status: 'created',
        paypal_order_id: orderData.id,
        currency: 'USD'
      })

    if (paymentError) {
      console.error('Database error:', paymentError)
      throw new Error('Failed to save payment record')
    }

    return new Response(
      JSON.stringify({ 
        orderId: orderData.id,
        approvalUrl: orderData.links.find((link: any) => link.rel === 'approve')?.href
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error creating PayPal order:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})