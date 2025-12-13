-- Create subscription_orders table for tracking bank transfer subscription purchases
CREATE TABLE public.subscription_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('families', 'business', 'entrepreneurs')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'payment_confirmed', 'active', 'cancelled', 'expired')),
  payment_confirmed BOOLEAN DEFAULT false,
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  payment_confirmed_by UUID,
  admin_notes TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whatsapp_templates table for nudge system
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('payment_reminder', 'payment_confirmation', 'welcome', 'renewal_reminder')),
  message_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_orders
ALTER TABLE public.subscription_orders ENABLE ROW LEVEL SECURITY;

-- Anyone can create subscription orders (public checkout)
CREATE POLICY "Anyone can create subscription orders"
ON public.subscription_orders
FOR INSERT
WITH CHECK (true);

-- Users can view their own orders by email match
CREATE POLICY "Users can view their own subscription orders"
ON public.subscription_orders
FOR SELECT
USING (customer_email = (auth.jwt() ->> 'email') OR has_role(auth.uid(), 'admin'));

-- Admins can manage all orders
CREATE POLICY "Admins can manage subscription orders"
ON public.subscription_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Enable RLS on whatsapp_templates
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view active templates
CREATE POLICY "Anyone can view active templates"
ON public.whatsapp_templates
FOR SELECT
USING (is_active = true);

-- Admins can manage templates
CREATE POLICY "Admins can manage whatsapp templates"
ON public.whatsapp_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Seed default WhatsApp templates
INSERT INTO public.whatsapp_templates (name, category, message_template, variables) VALUES
(
  'Payment Reminder',
  'payment_reminder',
  'Hi {customer_name}! 👋

Just a gentle reminder about your Nuacha {plan_type} subscription order ({order_reference}).

Amount: ${amount} USD

Please complete your bank transfer when you''re ready. Let me know if you have any questions!

– The Nuacha Team 🌿',
  '["customer_name", "plan_type", "order_reference", "amount"]'
),
(
  'Payment Confirmation',
  'payment_confirmation',
  'Hi {customer_name}! 🎉

Thank you for your payment! Your Nuacha {plan_type} subscription (Order: {order_reference}) is now active.

You can now log in and start tracking your expenses with peace of mind.

Welcome to Nuacha! 🌿',
  '["customer_name", "plan_type", "order_reference"]'
),
(
  'Welcome Message',
  'welcome',
  'Welcome to Nuacha, {customer_name}! 🌿

Your {plan_type} subscription is ready. Here''s how to get started:

1. Log in at nuacha.com
2. Create your first family
3. Scan your first receipt

Need help? Just reply to this message!

– The Nuacha Team',
  '["customer_name", "plan_type"]'
),
(
  'Renewal Reminder',
  'renewal_reminder',
  'Hi {customer_name}! 👋

Your Nuacha {plan_type} subscription will renew soon.

If you''d like to continue enjoying calm expense tracking, please make your renewal payment.

Amount: ${amount} USD

Thank you for being part of Nuacha! 🌿',
  '["customer_name", "plan_type", "amount"]'
);

-- Create index for faster lookups
CREATE INDEX idx_subscription_orders_status ON public.subscription_orders(status);
CREATE INDEX idx_subscription_orders_reference ON public.subscription_orders(order_reference);
CREATE INDEX idx_subscription_orders_email ON public.subscription_orders(customer_email);