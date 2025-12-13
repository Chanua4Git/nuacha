/**
 * Generate a unique order reference number for Nuacha
 * Format: NU-YYMMDD-XXXXX (prefix + date + 5 random alphanumeric)
 */
export function generateOrderReference(): string {
  const now = new Date();
  const datePart = now.getFullYear().toString().substring(2) + 
                 (now.getMonth() + 1).toString().padStart(2, '0') + 
                 now.getDate().toString().padStart(2, '0');
  
  // Characters without confusing ones (I, O, 0, 1)
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  
  for (let i = 0; i < 5; i++) {
    randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return `NU-${datePart}-${randomPart}`;  // e.g., NU-251213-AB7XK
}

/**
 * Validate order reference format
 */
export function isValidOrderReference(ref: string): boolean {
  return /^NU-\d{6}-[A-Z0-9]{5}$/.test(ref);
}
