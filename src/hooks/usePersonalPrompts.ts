import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PersonalNudge { label: string; starter: string }
export interface PersonalPrompts {
  examples: string[];
  nudges: PersonalNudge[];
  accountName: string | null;
  personName: string | null;
  empty: boolean;
}

const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const money = (n: number) => Math.round(n).toLocaleString('en-US');

/**
 * Builds Talk-it-through prompts from the signed-in person's own records only
 * (every query is RLS-scoped to them). Returns null for visitors.
 */
export const usePersonalPrompts = (enabled: boolean) => {
  const [data, setData] = useState<PersonalPrompts | null>(null);

  useEffect(() => {
    if (!enabled) { setData(null); return; }
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (!cancelled) setData(null); return; }
      const uid = session.user.id;
      const since = iso(new Date(Date.now() - 90 * DAY));
      const monthStart = iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

      const [fam, emp, acc, bills] = await Promise.all([
        supabase.from('families').select('id').eq('user_id', uid),
        supabase.from('employees').select('id, first_name').eq('user_id', uid).eq('is_active', true),
        supabase.from('money_accounts').select('name, known_balance_date').eq('user_id', uid).eq('is_active', true),
        supabase.from('monthly_recurring_payments').select('category_name, budgeted_amount, is_paid').eq('user_id', uid).eq('month', monthStart),
      ]);
      const famIds = (fam.data ?? []).map((f) => f.id);
      const exp = famIds.length
        ? await supabase.from('expenses').select('place, amount, date, category').in('family_id', famIds).gte('date', since).limit(1000)
        : { data: [] as any[] };
      const empIds = (emp.data ?? []).map((e) => e.id);
      const pay = empIds.length
        ? await supabase.from('payroll_entries').select('employee_id, gross_pay, entry_date').in('employee_id', empIds).gte('entry_date', since).limit(1000)
        : { data: [] as any[] };
      if (cancelled) return;

      const now = Date.now();
      const nudges: PersonalNudge[] = [];

      // Places: frequency, typical amount, cadence gap
      const byPlace = new Map<string, { dates: number[]; amounts: number[] }>();
      for (const e of exp.data ?? []) {
        const p = (e.place || '').trim(); if (!p) continue;
        const t = Date.parse(e.date); if (isNaN(t)) continue;
        const r = byPlace.get(p) ?? { dates: [], amounts: [] };
        r.dates.push(t); r.amounts.push(Number(e.amount) || 0); byPlace.set(p, r);
      }
      const places = [...byPlace.entries()].sort((a, b) => b[1].dates.length - a[1].dates.length).slice(0, 3);
      for (const [name, r] of places) {
        if (r.dates.length < 3) continue;
        const d = [...r.dates].sort((a, b) => a - b);
        const gaps = d.slice(1).map((t, i) => (t - d[i]) / DAY);
        const usual = median(gaps), since = (now - d[d.length - 1]) / DAY;
        if (usual >= 2 && since > usual * 1.5) {
          nudges.push({ label: `Anything at ${name} lately?`, starter: `Spent ${money(median(r.amounts))} at ${name} ` });
          break;
        }
      }

      // Staff pay cadence
      const names = new Map((emp.data ?? []).map((e) => [e.id, e.first_name]));
      const byEmp = new Map<string, { dates: number[]; amounts: number[] }>();
      for (const p of pay.data ?? []) {
        const t = Date.parse(p.entry_date); if (isNaN(t)) continue;
        const r = byEmp.get(p.employee_id) ?? { dates: [], amounts: [] };
        r.dates.push(t); r.amounts.push(Number(p.gross_pay) || 0); byEmp.set(p.employee_id, r);
      }
      const people = [...byEmp.entries()].sort((a, b) => b[1].dates.length - a[1].dates.length);
      for (const [id, r] of people) {
        const d = [...r.dates].sort((a, b) => a - b);
        const gaps = d.slice(1).map((t, i) => (t - d[i]) / DAY);
        const usual = Math.max(median(gaps), 1), since = (now - d[d.length - 1]) / DAY;
        if (d.length >= 2 && since > usual * 1.5) {
          const n = names.get(id);
          nudges.push({ label: `Paid ${n} recently?`, starter: `Paid ${n} ${money(median(r.amounts))} in cash ` });
          break;
        }
      }

      // Unpaid bills this month
      const unpaid = (bills.data ?? []).filter((b) => !b.is_paid);
      if (unpaid[0]) nudges.push({ label: `${unpaid[0].category_name} this month?`, starter: `Paid ${money(Number(unpaid[0].budgeted_amount) || 0)} for ${unpaid[0].category_name} ` });

      // Stale account balance
      const accounts = acc.data ?? [];
      const stale = accounts.find((a) => !a.known_balance_date || now - Date.parse(a.known_balance_date) > 30 * DAY);
      if (stale) nudges.push({ label: `Update ${stale.name} balance?`, starter: `The ${stale.name} balance is ` });

      const accountName = accounts[0]?.name ?? null;
      const personName = people[0] ? names.get(people[0][0]) ?? null : (emp.data?.[0]?.first_name ?? null);

      const parts: string[] = [];
      if (places[0]) parts.push(`spent ${money(median(places[0][1].amounts))} at ${places[0][0]}`);
      if (personName && people[0]) parts.push(`paid ${personName} ${money(median(people[0][1].amounts))}`);
      else if (places[1]) parts.push(`${money(median(places[1][1].amounts))} at ${places[1][0]}`);
      let ex = parts.join(', ');
      if (ex && accountName) ex += ` from ${accountName}`;
      void ex;
      const examples = ['I spent 300 at nuacha.com for a done-for-you setup, paid from my savings account ending 1234.'];

      const empty = !places.length && !people.length && !accounts.length;
      setData({ examples, nudges: nudges.slice(0, 2), accountName, personName, empty });
    })().catch(() => { if (!cancelled) setData(null); });
    return () => { cancelled = true; };
  }, [enabled]);

  return data;
};
