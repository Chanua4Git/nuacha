import { differenceInCalendarDays, format } from 'date-fns';
import { parseReceiptCalendarDate } from '@/utils/receipt/calendarDate';

export interface PurchaseLine { description: string; date: string; place: string; price?: number | null; }
export interface ShoppingSuggestion {
  key: string; name: string; lastDate: string; lastPlace: string; usualStore: string;
  times: number; avgGapDays: number | null; daysSince: number; due: boolean;
  lastPrice?: number | null; storePrices?: Record<string, number>;
}
export interface DueHint extends ShoppingSuggestion { avgGapDays: number; }

const products: [RegExp, string][] = [
  [/\bodomos\b/i, 'Odomos mosquito repellent'],
  [/\b(?:oats|oatmeal)\b/i, 'Oats'],
  [/\b(?:gloves?|nitrile)\b/i, 'Gloves'],
  [/\b(?:adult.*diapers?|diapers?.*adult)\b/i, 'Adult diapers'],
  [/\b(?:wet wipes?|washcloths?|wcloth|cleansing (?:cloths?|wipes?)|ms wipes|clnsg cloths)\b/i, 'Wipes / cleansing cloths'],
  [/\b(?:dettol|rexoguard|salve.*antiseptic)\b/i, 'Antiseptic liquid'],
  [/\b(?:yogurt|yoghurt)\b/i, 'Yogurt'],
  [/\bolive oil\b/i, 'Olive oil'],
  [/\bcoconut oil\b/i, 'Coconut oil'],
];

const clean = (s: string) => s.replace(/^\s*\d{4,}\s+/, '').replace(/\b\d+(?:\.\d+)?\s*(?:ml|kg|g|oz|lb|ct|pk|count)\b/gi, '').replace(/\s+/g, ' ').trim();
export const itemKey = (s: string): string => {
  const alias = products.find(([pattern]) => pattern.test(s));
  return (alias?.[1] || clean(s)).toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
};

function productName(description: string, place: string): string | null {
  if (/\b(?:misc|miscellaneous|unknown|item|department|tax|vat|discount|subtotal|total|payment|fee|delivery|service charge|membership)\b/i.test(description)) return null;
  // Restaurants and financial transactions are not household replenishment.
  if (/\b(?:pizza|fudge|restaurant|kfc|mcdonald|wendy|subway|starbucks|amazon|apple|canva|aeropost|prd trading|tstt|telecom|service station)\b/i.test(place)) return null;
  const alias = products.find(([pattern]) => pattern.test(description));
  if (alias) return alias[1];
  const name = clean(description);
  if (name.replace(/[^a-z]/gi, '').length < 4 || /^\d/.test(name)) return null;
  const householdItem = /\b(?:rice|milk|eggs?|bread|butter|cheese|broccoli|lentils?|beans?|peas|sardines?|tuna|chicken|beef|fish|flour|sugar|salt|pepper|cinnamon|cumin|fennel|fenugreek|seasoning|fruit|apples?|pears?|bananas?|onions?|potatoes?|tomatoes?|carrots?|lettuce|spinach|juice|water|tea|coffee|cereal|pasta|soap|cream|shampoo|conditioner|toothpaste|tissue|paper towel|toilet|detergent|bleach|cleaner|repellent|mosquito|insect|bug spray|diapers?|wipes?|callus)\b/i.test(name);
  const groceryStore = /\b(?:pricesmart|price smart|pennywise|massy|jta|jt's|tru valu|xtra foods|supermarket|grocery)\b/i.test(place);
  if (!householdItem && !groceryStore) return null;
  return name === name.toUpperCase() ? name.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase()) : name;
}

/** Saved purchases are evidence of buying, not evidence that stock has run out. */
export function shoppingSuggestions(lines: PurchaseLine[], today: string): ShoppingSuggestion[] {
  const now = parseReceiptCalendarDate(today);
  if (!now) return [];
  const groups = new Map<string, (PurchaseLine & { name: string })[]>();
  for (const line of lines) {
    const date = parseReceiptCalendarDate(line.date);
    const name = productName(line.description || '', line.place || '');
    if (!date || !name || differenceInCalendarDays(now, date) < 0) continue;
    const key = itemKey(name);
    const group = groups.get(key) || [];
    group.push({ ...line, date: format(date, 'yyyy-MM-dd'), name });
    groups.set(key, group);
  }
  const out: ShoppingSuggestion[] = [];
  for (const [key, purchases] of groups) {
    purchases.sort((a, b) => b.date.localeCompare(a.date));
    const latest = purchases[0];
    if (!latest) continue;
    const dates = [...new Set(purchases.map(p => p.date))].sort();
    const firstDate = parseReceiptCalendarDate(dates[0]);
    const lastDate = parseReceiptCalendarDate(latest.date);
    if (!firstDate || !lastDate) continue;
    const avgGapDays = dates.length >= 3 ? Math.max(1, Math.round(differenceInCalendarDays(lastDate, firstDate) / (dates.length - 1))) : null;
    const daysSince = differenceInCalendarDays(now, lastDate);
    const stores = new Map<string, Set<string>>();
    for (const p of purchases) {
      if (!p.place.trim()) continue;
      const days = stores.get(p.place) || new Set<string>();
      days.add(p.date); stores.set(p.place, days);
    }
    const usualStore = [...stores].sort((a, b) => b[1].size - a[1].size)[0]?.[0] || '';
    const storePrices: Record<string, number> = {};
    for (const p of [...purchases].reverse()) if (p.price && p.price > 0 && p.place.trim()) storePrices[p.place] = p.price;
    out.push({ lastPrice: latest.price ?? null, storePrices, key, name: latest.name, lastDate: latest.date, lastPlace: latest.place, usualStore, times: dates.length, avgGapDays, daysSince, due: avgGapDays !== null && daysSince >= avgGapDays });
  }
  return out.sort((a, b) => Number(b.due) - Number(a.due) || b.times - a.times || b.lastDate.localeCompare(a.lastDate));
}

export function dueHints(lines: PurchaseLine[], today: string): DueHint[] {
  return shoppingSuggestions(lines, today).filter((s): s is DueHint => s.due && s.avgGapDays !== null);
}