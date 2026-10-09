/** Which saved receipts / bulk groups the person has already checked, kept on this device. */
const KEY = 'nuacha:review-state';

interface ReviewState { checked: string[]; finished: string[] }

const read = (): ReviewState => {
  try { return { checked: [], finished: [], ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { checked: [], finished: [] }; }
};
const put = (s: ReviewState) => {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event('nuacha:review-state'));
};
export const getReviewState = read;
export const toggleReviewed = (id: string) => {
  const s = read();
  put({ ...s, checked: s.checked.includes(id) ? s.checked.filter((x) => x !== id) : [...s.checked, id] });
};
export const finishGroup = (key: string) => { const s = read(); put({ ...s, finished: [...new Set([...s.finished, key])] }); };

export interface SavedRow { id: string; created_at: string }
/** Receipts saved within 3 minutes of each other count as one bulk group (2+ receipts). */
export function groupBulkSaves(rows: SavedRow[], gapMs = 3 * 60 * 1000): SavedRow[][] {
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const groups: SavedRow[][] = [];
  for (const r of sorted) {
    const g = groups[groups.length - 1];
    if (g && new Date(r.created_at).getTime() - new Date(g[g.length - 1].created_at).getTime() <= gapMs) g.push(r);
    else groups.push([r]);
  }
  return groups.filter((g) => g.length >= 2).reverse();
}
