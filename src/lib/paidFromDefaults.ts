import { supabase } from '@/integrations/supabase/client';
import type { PaidFromValue } from '@/lib/paidFrom';

export type DefaultKind = 'employee' | 'category' | 'place';

export interface PaidFromDefault {
  id: string;
  kind: DefaultKind;
  match_key: string;
  label: string;
  account_id: string | null;
  monthly_estimate: number | null;
  notes: string | null;
}

let cache: Promise<PaidFromDefault[]> | null = null;

export const loadPaidFromDefaults = (force = false): Promise<PaidFromDefault[]> => {
  if (!cache || force) {
    cache = (async () => {
      const { data } = await (supabase as any).from('paid_from_defaults').select('*').order('label');
      return (data ?? []) as PaidFromDefault[];
    })().catch(() => { cache = null; return []; });
  }
  return cache;
};

export const clearPaidFromDefaultsCache = () => { cache = null; };

const norm = (s?: string | null) => (s ?? '').trim().toLowerCase();

/** Finds the usual account for a wage (employee) or an expense (place first, then category). */
export const lookupPaidFromDefault = async (q: { employeeId?: string; place?: string; categoryId?: string }): Promise<PaidFromValue> => {
  const rows = (await loadPaidFromDefaults()).filter((r) => r.account_id);
  const hit =
    (q.employeeId && rows.find((r) => r.kind === 'employee' && r.match_key === q.employeeId)) ||
    (q.place && rows.find((r) => r.kind === 'place' && r.match_key === norm(q.place))) ||
    (q.place && rows.find((r) => r.kind === 'place' && norm(q.place).includes(r.match_key))) ||
    (q.categoryId && rows.find((r) => r.kind === 'category' && r.match_key === q.categoryId));
  return hit ? `acct:${hit.account_id}` : null;
};
