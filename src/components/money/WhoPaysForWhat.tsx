import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExpense } from '@/context/ExpenseContext';
import { clearPaidFromDefaultsCache, type DefaultKind, type PaidFromDefault } from '@/lib/paidFromDefaults';

const tt = (n: number) => `TT$${n.toLocaleString('en-TT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const KIND_LABEL: Record<DefaultKind, string> = { employee: 'Wages', category: 'Categories', place: 'Shops & bills' };

interface Props { accounts: { id: string; name: string }[] }

/** Who pays for what: the usual account for each regular wage, category or place. New entries pre-fill from here. */
const WhoPaysForWhat = ({ accounts }: Props) => {
  const { categories } = useExpense();
  const [rows, setRows] = useState<PaidFromDefault[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [newKind, setNewKind] = useState<DefaultKind>('place');
  const [newKey, setNewKey] = useState('');

  const load = async () => {
    const { data } = await (supabase as any).from('paid_from_defaults').select('*').order('label');
    setRows((data ?? []) as PaidFromDefault[]);
    clearPaidFromDefaultsCache();
  };

  useEffect(() => {
    void load();
    supabase.from('employees').select('id, first_name, last_name').eq('is_active', true).order('first_name')
      .then(({ data }) => setEmployees((data ?? []).map((e: any) => ({ id: e.id, name: `${e.first_name} ${e.last_name}` }))));
  }, []);

  const update = async (id: string, patch: Partial<PaidFromDefault>) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await (supabase as any).from('paid_from_defaults').update(patch).eq('id', id);
    if (error) toast.error("That didn't save — let's try again.");
    clearPaidFromDefaultsCache();
  };

  const remove = async (id: string) => {
    setRows((r) => r.filter((x) => x.id !== id));
    await (supabase as any).from('paid_from_defaults').delete().eq('id', id);
    clearPaidFromDefaultsCache();
  };

  const add = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newKey.trim()) return;
    let match_key = newKey.trim();
    let label = match_key;
    if (newKind === 'employee') label = `${employees.find((e) => e.id === newKey)?.name ?? 'Person'} – wages`;
    if (newKind === 'category') label = categories.find((c: any) => c.id === newKey)?.name ?? 'Category';
    if (newKind === 'place') match_key = match_key.toLowerCase();
    const { error } = await (supabase as any).from('paid_from_defaults')
      .insert({ user_id: user.id, kind: newKind, match_key, label });
    if (error) { toast.error(error.code === '23505' ? 'That one is already on the list.' : "That didn't save — let's try again."); return; }
    setNewKey('');
    void load();
  };

  const byAccount = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => { if (r.account_id) m.set(r.account_id, (m.get(r.account_id) ?? 0) + Number(r.monthly_estimate || 0)); });
    return accounts.filter((a) => m.has(a.id)).map((a) => ({ ...a, total: m.get(a.id)! }));
  }, [rows, accounts]);

  const unset = rows.filter((r) => !r.account_id).length;
  const groups: DefaultKind[] = ['employee', 'category', 'place'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-primary" /> Who pays for what
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          The usual account for each regular cost. New wages and expenses fill this in for you, and you can always change it.
          Changing it here only affects new entries.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {byAccount.map((a) => (
            <div key={a.id} className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground truncate">{a.name}</div>
              <div className="font-medium">{tt(a.total)}</div>
              <div className="text-[11px] text-muted-foreground">usual monthly costs</div>
            </div>
          ))}
        </div>
        {unset > 0 && <p className="text-sm text-muted-foreground">{unset} still need an account — pick one when you're ready.</p>}

        <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide the list' : `Check the list (${rows.length})`}
        </Button>

        {open && (
          <div className="space-y-5">
            {groups.map((k) => {
              const list = rows.filter((r) => r.kind === k);
              if (!list.length) return null;
              return (
                <div key={k} className="space-y-2">
                  <h3 className="text-sm font-medium">{KIND_LABEL[k]}</h3>
                  {list.map((r) => (
                    <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-2 border-b pb-2">
                      <div className="flex-1 min-w-0 break-words text-sm">{r.label}</div>
                      <Select value={r.account_id ?? 'none'} onValueChange={(v) => update(r.id, { account_id: v === 'none' ? null : v })}>
                        <SelectTrigger className="sm:w-56"><SelectValue placeholder="Not set yet" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not set yet</SelectItem>
                          {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number" inputMode="decimal" placeholder="TT$ / month" className="sm:w-32"
                          defaultValue={r.monthly_estimate ?? ''}
                          onBlur={(e) => {
                            const v = e.target.value === '' ? null : Number(e.target.value);
                            if (v !== r.monthly_estimate) void update(r.id, { monthly_estimate: v });
                          }}
                        />
                        <Button variant="ghost" size="icon" aria-label={`Remove ${r.label}`} onClick={() => remove(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Select value={newKind} onValueChange={(v) => { setNewKind(v as DefaultKind); setNewKey(''); }}>
                <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="place">Shop or bill</SelectItem>
                  <SelectItem value="employee">Person's wages</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
              {newKind === 'place' ? (
                <Input placeholder="e.g. PriceSmart" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
              ) : (
                <Select value={newKey} onValueChange={setNewKey}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Choose…" /></SelectTrigger>
                  <SelectContent>
                    {(newKind === 'employee' ? employees : (categories as any[]).map((c) => ({ id: c.id, name: c.name })))
                      .map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={add} disabled={!newKey.trim()}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhoPaysForWhat;
