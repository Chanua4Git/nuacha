/** Which saved receipts / bulk groups the person has checked. Saved to their account (review_marks); a local copy keeps it instant. */
import { supabase } from '@/integrations/supabase/client';

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

/** Pull the signed-in account's marks so phone and laptop agree. */
export async function syncReviewState() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data, error } = await (supabase as any).from('review_marks').select('kind, ref_id');
  if (error || !data) return;
  put({
    checked: data.filter((r: any) => r.kind === 'checked').map((r: any) => r.ref_id),
    finished: data.filter((r: any) => r.kind === 'finished').map((r: any) => r.ref_id),
  });
}

const remote = async (kind: string, ref_id: string, add: boolean) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const t = (supabase as any).from('review_marks');
  if (add) await t.upsert({ user_id: user.id, kind, ref_id }, { onConflict: 'user_id,kind,ref_id', ignoreDuplicates: true });
  else await t.delete().eq('kind', kind).eq('ref_id', ref_id);
};

export const toggleReviewed = (id: string) => {
  const s = read();
  const on = !s.checked.includes(id);
  put({ ...s, checked: on ? [...s.checked, id] : s.checked.filter((x) => x !== id) });
  void remote('checked', id, on);
};
export const finishGroup = (key: string) => {
  const s = read();
  put({ ...s, finished: [...new Set([...s.finished, key])] });
  void remote('finished', key, true);
};

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
