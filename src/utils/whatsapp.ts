import { NUACHA_WHATSAPP_NUMBER, formatTTD, formatUSD } from '@/constants/nuachaPayment';

/**
 * Generate a WhatsApp URL with pre-filled message
 */
export function generateWhatsAppUrl(phoneNumber: string, message: string): string {
  // Clean phone number - remove all non-digits
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Generate WhatsApp URL for Nuacha support
 */
export function generateNuachaWhatsAppUrl(message: string): string {
  return generateWhatsAppUrl(NUACHA_WHATSAPP_NUMBER, message);
}

/**
 * Open WhatsApp in new tab
 */
export function openWhatsApp(phoneNumber: string, message: string): void {
  const url = generateWhatsAppUrl(phoneNumber, message);
  window.open(url, '_blank');
}

/**
 * Replace template variables with actual values
 */
export function replaceTemplateVariables(
  template: string, 
  context: Record<string, string | number | undefined>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(context)) {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  }
  
  return result;
}

/**
 * Generate payment screenshot message for customer (TTD-first)
 */
export function generatePaymentScreenshotMessage(
  orderReference: string,
  customerName: string,
  planType: string,
  amountTTD: number,
  amountUSD?: number
): string {
  const usdLine = amountUSD ? `\n(${formatUSD(amountUSD)})` : '';
  
  return `Hi! I've completed my bank transfer for my Nuacha subscription.

Order Reference: ${orderReference}
Name: ${customerName}
Plan: ${planType}
Amount: ${formatTTD(amountTTD)}${usdLine}

[Please attach your payment screenshot]`;
}

/**
 * WhatsApp message templates for admin nudges
 */
export const WHATSAPP_TEMPLATES = {
  payment_reminder: `Hi {customer_name}! 👋

Just a gentle reminder about your Nuacha subscription order (Ref: {order_reference}).

Amount: {amount_ttd}
({amount_usd})

When you're ready, you can complete the bank transfer to:
First Citizens Bank
Account: 2991223
Name: Nuacha Ltd

Send us a screenshot of your transfer and we'll activate your account right away! 💚`,

  payment_confirmation: `Hi {customer_name}! 🎉

Great news! We've received your payment for Nuacha.

Order: {order_reference}
Plan: {plan_name}
Amount: {amount_ttd}

Your account is now active! You can start using all your premium features right away.

Questions? Just message us here. Welcome to Nuacha! 💚`,

  welcome_message: `Hi {customer_name}! 👋

Welcome to Nuacha - a softer way to track spending. 💚

Your {plan_name} account is all set up and ready to go. Here's what you can do:

✨ Scan receipts with AI
📊 Track expenses by family
💰 Build budgets that work

Need any help getting started? Just reply here and we'll guide you through!`,

  renewal_reminder: `Hi {customer_name}! 👋

Your Nuacha {plan_name} subscription is coming up for renewal on {renewal_date}.

To continue enjoying unlimited scans, budget tools, and all your premium features, renew with a bank transfer of {amount_ttd}.

Same bank details as before:
First Citizens Bank
Account: 2991223

Send us your payment screenshot when ready. Thank you for being part of Nuacha! 💚`
};
