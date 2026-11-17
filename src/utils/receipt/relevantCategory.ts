// Specific services outrank generic store and usage history; these are suggestions, not writes.
export function relevantServiceCategory<T extends { id: string; name: string }>(place: string | undefined, items: { description: string }[] | undefined, categories: T[]) {
  const text = `${place || ''} ${(items || []).map(i => i.description).join(' ')}`.toLowerCase();
  const dental = /\bdental\b|\bdentist\b|\borthodont|\btooth extraction\b/.test(text);
  const medical = /\bdoctor\b|\bdr[.\s]|\bconsultation\b|\bpaediatric|\bpediatric/.test(text);
  if (!dental && !medical) return undefined;
  const preferred = dental ? [/^dental$/i, /dentist|dental(?! insurance)/i, /^doctor visits$/i, /^doctor$/i, /medical|healthcare/i] : [/^doctor visits$/i, /^doctor$/i, /medical|healthcare/i];
  for (const pattern of preferred) {
    const category = categories.find(c => pattern.test(c.name));
    if (category) return { category, confidence: dental ? 98 : 95, reason: dental ? 'Dental service on this receipt' : 'Medical service on this receipt' };
  }
  return undefined;
}