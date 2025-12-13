import { NUACHA_WHATSAPP_NUMBER } from '@/constants/nuachaPayment';

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
 * Generate payment screenshot message for customer
 */
export function generatePaymentScreenshotMessage(
  orderReference: string,
  customerName: string,
  planType: string,
  amount: number
): string {
  return `Hi! I've completed my bank transfer for my Nuacha subscription.

Order Reference: ${orderReference}
Name: ${customerName}
Plan: ${planType}
Amount: $${amount.toFixed(2)} USD

[Please attach your payment screenshot]`;
}
