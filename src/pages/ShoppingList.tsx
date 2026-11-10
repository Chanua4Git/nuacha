import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ShoppingBasket, Plus, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { dueHints, itemKey, type DueHint } from '@/lib/shoppingHints';

interface Item { id: string; list_name: string; name: string; store: string | null; is_checked: boolean; }
const db = supabase as any;
const LISTS = ['Household', 'Yard'];

export default function ShoppingList() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [hints, setHints] = useState<DueHint[]>([]);
  const [list, setList] = useState('Household');
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [newList, setNewList] = useState('');

  const load = async () => {
    const { data, error } = await db.from('shopping_list_items').select('*').order('created_at');
    if (error) toast('We couldn’t load your list just now.'); else setItems(data || []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    (async () => {
      const { data } = await db.from('receipt_line_items')
        .select('description, expenses!inner(date, place)').order('created_at', { ascending: false }).limit(3000);
      const lines = (data || []).map((r: any) => ({ description: r.description, date: r.expenses?.date || '', place: r.expenses?.place || '' }));
      setHints(dueHints(lines, format(new Date(), 'yyyy-MM-dd')).slice(0, 15));
    })();
  }, [user]);

  const lists = useMemo(() => [...new Set([...LISTS, ...items.map(i => i.list_name)])], [items]);
  const current = items.filter(i => i.list_name === list);
  const onList = new Set(items.filter(i => !i.is_checked).map(i => itemKey(i.name)));

  const add = async (n: string, s: string) => {
    if (!n.trim() || !user) return;
    const { error } = await db.from('shopping_list_items').insert({ user_id: user.id, list_name: list, name: n.trim(), store: s.trim() || null });
    if (error) return toast('That didn’t save — try again in a moment.');
    setName(''); setStore(''); load();
  };
  const toggle = async (i: Item) => { await db.from('shopping_list_items').update({ is_checked: !i.is_checked }).eq('id', i.id); load(); };
  const remove = async (id: string) => { await db.from('shopping_list_items').delete().eq('id', id); load(); };
  const clearDone = async () => { await db.from('shopping_list_items').delete().eq('list_name', list).eq('is_checked', true); load(); };

  const byStore = current.reduce<Record<string, Item[]>>((a, i) => { (a[i.store || 'Any store'] ||= []).push(i); return a; }, {});

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-playfair flex items-center gap-2"><ShoppingBasket className="h-6 w-6 text-primary" /> Shopping list</h1>
        <p className="text-sm text-muted-foreground">Keep a list for each home and the yard. Hints come from your saved receipts.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {lists.map(l => <Button key={l} size="sm" variant={l === list ? 'default' : 'outline'} onClick={() => setList(l)}>{l}</Button>)}
        <form className="flex gap-1" onSubmit={e => { e.preventDefault(); if (newList.trim()) { setList(newList.trim()); setNewList(''); } }}>
          <Input value={newList} onChange={e => setNewList(e.target.value)} placeholder="New list" className="h-9 w-28" />
          <Button size="sm" variant="ghost" type="submit" aria-label="Add list"><Plus className="h-4 w-4" /></Button>
        </form>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">{list}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-col sm:flex-row gap-2" onSubmit={e => { e.preventDefault(); add(name, store); }}>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Item (e.g. eggs)" />
            <Input value={store} onChange={e => setStore(e.target.value)} placeholder="Store (optional)" className="sm:w-44" />
            <Button type="submit"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </form>
          {current.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet — and that’s okay.</p>}
          {Object.entries(byStore).map(([s, its]) => (
            <div key={s}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{s}</p>
              {its.map(i => (
                <div key={i.id} className="flex items-center gap-3 py-1.5">
                  <Checkbox checked={i.is_checked} onCheckedChange={() => toggle(i)} aria-label={`Got ${i.name}`} />
                  <span className={`flex-1 ${i.is_checked ? 'line-through text-muted-foreground' : ''}`}>{i.name}</span>
                  <Button size="icon" variant="ghost" onClick={() => remove(i.id)} aria-label={`Remove ${i.name}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          ))}
          {current.some(i => i.is_checked) && <Button variant="outline" size="sm" onClick={clearDone}>Clear ticked items</Button>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Probably due</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {hints.length === 0 && <p className="text-sm text-muted-foreground">Scan a few more receipts and I’ll start spotting what’s due.</p>}
          {hints.map(h => (
            <div key={h.key} className="flex items-center gap-3 py-1">
              <div className="flex-1 min-w-0">
                <p className="truncate">{h.name}</p>
                <p className="text-xs text-muted-foreground">Usually every {h.avgGapDays} days · last {h.lastDate}{h.lastPlace ? ` at ${h.lastPlace}` : ''}</p>
              </div>
              {onList.has(h.key) ? <Badge variant="secondary">On list</Badge>
                : <Button size="sm" variant="outline" onClick={() => add(h.name, h.lastPlace)}>Add</Button>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
