/** The last batch of receipts saved together, kept on this device until the person finishes checking them. */
const KEY = 'nuacha:review-batch';

export interface ReviewBatch { ids: string[]; checked: string[]; savedAt: number }

export const getReviewBatch = (): ReviewBatch | null => {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
};
const put = (b: ReviewBatch | null) => {
  if (b) localStorage.setItem(KEY, JSON.stringify(b)); else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('nuacha:review-batch'));
};
export const startReviewBatch = (ids: string[]) => put({ ids, checked: [], savedAt: Date.now() });
export const toggleReviewed = (id: string) => {
  const b = getReviewBatch(); if (!b) return;
  put({ ...b, checked: b.checked.includes(id) ? b.checked.filter((x) => x !== id) : [...b.checked, id] });
};
export const clearReviewBatch = () => put(null);
