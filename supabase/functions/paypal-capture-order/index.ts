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

    const { orderId } = await req.json()

    if (!orderId) {
      throw new Error('Missing orderId')
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('paypal_payments')
      .select('*')
      .eq('paypal_order_id', orderId)
      .eq('user_id', user.id)
      .single()

    if (paymentError || !payment) {
      throw new Error('Payment record not found')
    }

    // Get PayPal credentials
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

    // Capture the order
    const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.access_token}`,
      }
    })

    const captureData = await captureResponse.json()
    
    if (!captureResponse.ok) {
      console.error('PayPal capture error:', captureData)
      throw new Error('Failed to capture PayPal payment')
    }

    // Update payment record
    const { error: updateError } = await supabase
      .from('paypal_payments')
      .update({
        status: 'completed',
        paypal_payment_id: captureData.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error('Failed to update payment record')
    }

    // Update payroll period status
    const { error: periodUpdateError } = await supabase
      .from('payroll_periods')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        transaction_id: captureData.id
      })
      .eq('id', payment.payroll_period_id)

    if (periodUpdateError) {
      console.error('Payroll period update error:', periodUpdateError)
      throw new Error('Failed to update payroll period')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        paymentId: captureData.id,
        status: captureData.status
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error capturing PayPal payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})