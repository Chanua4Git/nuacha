import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import type { AppMapCounts } from '@/constants/appMap';

export function useAppMapCounts() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<AppMapCounts | null>(null);

  useEffect(() => {
    if (!user) { setCounts(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const head = { count: 'exact' as const, head: true };
        const [f, m, e, r, b, rem, cat] = await Promise.all([
          supabase.from('families').select('*', head).eq('user_id', user.id),
          supabase.from('family_members').select('*, families!inner(*)', head).eq('families.user_id', user.id),
          supabase.from('expenses').select('*, families!inner(*)', head).eq('families.user_id', user.id),
          supabase.from('receipt_details').select('*, expenses!inner(*, families!inner(*))', head).eq('expenses.families.user_id', user.id),
          supabase.from('budgets').select('*, families!inner(*)', head).eq('families.user_id', user.id),
          supabase.from('reminders').select('*, families!inner(*)', head).eq('families.user_id', user.id),
          supabase.from('categories').select('*', head).eq('user_id', user.id),
        ]);
        if (!cancelled) setCounts({
          families: f.count || 0, members: m.count || 0, expenses: e.count || 0,
          receipts: r.count || 0, budgets: b.count || 0, reminders: rem.count || 0, categories: cat.count || 0,
        });
      } catch {
        if (!cancelled) setCounts({ families: 0, members: 0, expenses: 0, receipts: 0, budgets: 0, reminders: 0, categories: 0 });
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return counts;
}
