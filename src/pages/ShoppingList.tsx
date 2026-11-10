import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ShoppingBasket, Plus, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { shoppingSuggestions, itemKey, type ShoppingSuggestion, type PurchaseLine } from '@/lib/shoppingHints';
import { parseReceiptCalendarDate } from '@/utils/receipt/calendarDate';

interface Item { id: string; list_name: string; name: string; store: string | null; is_checked: boolean; }
const LISTS = ['Household', 'Yard'];
const dateLabel = (value: string) => {
  const date = parseReceiptCalendarDate(value);
  return date ? format(date, 'd MMM yyyy') : value;
};

export default function ShoppingList() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [hints, setHints] = useState<ShoppingSuggestion[]>([]);
  const [list, setList] = useState('Household');
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [newList, setNewList] = useState('');
  const [extraLists, setExtraLists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptError, setReceiptError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [receiptCount, setReceiptCount] = useState(0);

  useEffect(() => {
    const update = () => setRefresh(v => v + 1);
    const visible = () => { if (document.visibilityState === 'visible') update(); };
    window.addEventListener('nuacha:checkin-saved', update);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.removeEventListener('nuacha:checkin-saved', update);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('shopping_list_items').select('*').eq('user_id', user.id).order('created_at');
    if (error) toast('We couldn’t load your list just now.'); else setItems(data || []);
  };

  useEffect(() => {
    setItems([]); setHints([]); setSelected(new Set());
    if (!user) { setLoading(false); return; }
    let active = true;
    load();
    (async () => {
      setLoading(true); setReceiptError(false);
      try {
        const { data: families, error: familyError } = await supabase.from('families').select('id').eq('user_id', user.id);
        if (familyError) throw familyError;
        const familyIds = (families || []).map(f => f.id);
        const lines: PurchaseLine[] = [];
        const receiptIds = new Set<string>();
        if (familyIds.length) {
          for (let offset = 0; ; offset += 1000) {
            const { data, error } = await supabase.from('receipt_line_items')
              .select('id, description, expense_id, expenses!inner(date, place, family_id)')
              .in('expenses.family_id', familyIds).order('id').range(offset, offset + 999);
            if (error) throw error;
            if (!active) return;
            for (const row of data || []) {
              lines.push({ description: row.description, date: row.expenses.date, place: row.expenses.place });
              receiptIds.add(row.expense_id);
            }
            if (!data || data.length < 1000) break;
          }
        }
        if (active) {
          setHints(shoppingSuggestions(lines, format(new Date(), 'yyyy-MM-dd')));
          setReceiptCount(receiptIds.size);
        }
      } catch {
        if (active) setReceiptError(true);
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [user?.id, refresh]);

  const lists = useMemo(() => [...new Set([...LISTS, ...extraLists, ...items.map(i => i.list_name)])], [items, extraLists]);
  const current = items.filter(i => i.list_name === list);
  const onList = new Set(current.filter(i => !i.is_checked).map(i => itemKey(i.name)));
  const visible = hints.filter(h => (filter === 'all' || (filter === 'due' ? h.due : h.daysSince <= 14)) && `${h.name} ${h.usualStore} ${h.lastPlace}`.toLowerCase().includes(search.toLowerCase()));
  const selectedHints = hints.filter(h => selected.has(h.key) && !onList.has(h.key));

  const addItems = async (entries: { name: string; store: string }[]) => {
    if (!user || saving) return;
    const unique = entries.filter((entry, index, all) => entry.name.trim() && !onList.has(itemKey(entry.name)) && all.findIndex(e => itemKey(e.name) === itemKey(entry.name)) === index);
    if (!unique.length) return toast('Those items are already on this list.');
    setSaving(true);
    const { error } = await supabase.from('shopping_list_items').insert(unique.map(entry => ({ user_id: user.id, list_name: list, name: entry.name.trim(), store: entry.store.trim() || null })));
    setSaving(false);
    if (error) return toast('That didn’t save — try again in a moment.');
    setName(''); setStore(''); setSelected(new Set());
    await load();
    toast(`${unique.length === 1 ? 'Item' : `${unique.length} items`} added to ${list}.`);
  };
  const toggle = async (i: Item) => {
    if (!user) return;
    const { error } = await supabase.from('shopping_list_items').update({ is_checked: !i.is_checked }).eq('id', i.id).eq('user_id', user.id);
    if (error) return toast('That didn’t save — please try again.');
    load();
  };
  const remove = async (id?: string) => {
    if (!user) return;
    const query = supabase.from('shopping_list_items').delete().eq('user_id', user.id);
    const { error } = await (id ? query.eq('id', id) : query.eq('list_name', list).eq('is_checked', true));
    if (error) return toast('That didn’t save — please try again.');
    load();
  };
  const byStore = current.reduce<Record<string, Item[]>>((a, i) => { (a[i.store || 'Any store'] ||= []).push(i); return a; }, {});

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-playfair flex items-center gap-2"><ShoppingBasket className="h-6 w-6 text-primary shrink-0" /> Shopping list</h1>
      <div className="flex flex-wrap gap-2">
        {lists.map(l => <Button key={l} size="sm" variant={l === list ? 'default' : 'outline'} onClick={() => { setList(l); setSelected(new Set()); }}>{l}</Button>)}
        <form className="flex gap-1" onSubmit={e => { e.preventDefault(); if (newList.trim()) { setExtraLists(prev => [...prev, newList.trim()]); setList(newList.trim()); setSelected(new Set()); setNewList(''); } }}>
          <Input value={newList} onChange={e => setNewList(e.target.value)} placeholder="New list" aria-label="New list name" className="h-9 w-28" />
          <Button size="sm" variant="ghost" type="submit" aria-label="Add list"><Plus className="h-4 w-4" /></Button>
        </form>
      </div>

      <section className="space-y-4 order-last" aria-label="Receipt suggestions">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-playfair flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary shrink-0" /> Smart shopping suggestions</h2>
          <Button variant="ghost" size="icon" aria-label="Refresh receipt suggestions" title="Refresh receipt suggestions" disabled={loading} onClick={() => setRefresh(v => v + 1)}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} /></Button>
        </div>
        {!loading && !receiptError && <p className="text-sm text-muted-foreground">{receiptCount} saved receipts · {hints.length} shopping items</p>}
        <div className="flex flex-wrap gap-2">
          {[['all', 'All purchases'], ['due', 'Probably due'], ['recent', 'Bought recently']].map(([value, label]) => <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)}>{label}</Button>)}
        </div>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items or stores" aria-label="Search receipt suggestions" />
        {loading ? <p className="text-sm text-muted-foreground" role="status">Gathering your saved purchases…</p> : receiptError ? <p className="text-sm text-muted-foreground" role="alert">Your receipts couldn’t load just now. Please try refreshing.</p> : (
          <>
            {visible.length === 0 && <p className="text-sm text-muted-foreground">{hints.length ? 'No purchases match this selection.' : 'No recognisable shopping items in your saved receipts yet.'}</p>}
            {visible.length > 0 && <div className="flex items-center justify-between gap-2 flex-wrap">
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set(visible.filter(h => !onList.has(h.key)).map(h => h.key)))}>Select shown items</Button>
              <Button size="sm" disabled={saving || !selectedHints.length} onClick={() => addItems(selectedHints.map(h => ({ name: h.name, store: h.usualStore })))}><Plus className="h-4 w-4 mr-1" />{saving ? 'Saving…' : `Add selected (${selectedHints.length})`}</Button>
            </div>}
            <div className="divide-y divide-border">
              {visible.map(h => <div key={h.key} className="flex items-start gap-3 py-3">
                <Checkbox className="mt-1" checked={onList.has(h.key) || selected.has(h.key)} disabled={onList.has(h.key) || saving} aria-label={`Select ${h.name}`} onCheckedChange={checked => setSelected(prev => { const next = new Set(prev); if (checked) next.add(h.key); else next.delete(h.key); return next; })} />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium break-words">{h.name}</p>
                  <p className="text-xs text-muted-foreground break-words">Last bought {dateLabel(h.lastDate)}{h.lastPlace ? ` · ${h.lastPlace}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{h.avgGapDays ? `Usually every ${h.avgGapDays} days · ${h.times} purchase days` : 'Cadence not recorded yet'}</p>
                  {h.usualStore && h.usualStore !== h.lastPlace && <p className="text-xs text-muted-foreground break-words">Usual store: {h.usualStore}</p>}
                  <Badge variant={h.due ? 'outline' : 'secondary'}>{onList.has(h.key) ? 'On list' : h.due ? 'Worth checking stock' : h.daysSince <= 14 ? 'Recently bought' : 'Past purchase'}</Badge>
                </div>
                {!onList.has(h.key) && <Button size="icon" variant="outline" disabled={saving} aria-label={`Add ${h.name}`} title={`Add ${h.name}`} onClick={() => addItems([{ name: h.name, store: h.usualStore }])}><Plus className="h-4 w-4" /></Button>}
              </div>)}
            </div>
          </>
        )}
      </section>

      <section className="space-y-4 border-t border-border pt-5" aria-label={list}>
        <h2 className="text-xl font-playfair break-words">{list} <span className="text-sm font-sans text-muted-foreground">({current.filter(i => !i.is_checked).length} to get)</span></h2>
        <form className="flex flex-col sm:flex-row gap-2" onSubmit={e => { e.preventDefault(); addItems([{ name, store }]); }}>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Item (e.g. eggs)" aria-label="Shopping item" />
          <Input value={store} onChange={e => setStore(e.target.value)} placeholder="Store (optional)" aria-label="Shopping store" className="sm:w-44" />
          <Button type="submit" disabled={saving || !name.trim()}><Plus className="h-4 w-4 mr-1" /> Add</Button>
        </form>
        {current.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet — and that’s okay.</p>}
        {Object.entries(byStore).map(([s, its]) => <div key={s}>
          <h3 className="text-sm font-medium text-primary mb-1 break-words">{s}</h3>
          {its.map(i => <div key={i.id} className="flex items-center gap-3 py-1.5">
            <Checkbox checked={i.is_checked} onCheckedChange={() => toggle(i)} aria-label={`Got ${i.name}`} />
            <div className="flex-1 min-w-0">
              <span className={`break-words ${i.is_checked ? 'line-through text-muted-foreground' : ''}`}>{i.name}</span>
              {hints.find(h => h.key === itemKey(i.name)) && <p className="text-xs text-muted-foreground">Last bought {dateLabel(hints.find(h => h.key === itemKey(i.name))?.lastDate || '')}</p>}
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(i.id)} aria-label={`Remove ${i.name}`} title={`Remove ${i.name}`}><Trash2 className="h-4 w-4" /></Button>
          </div>)}
        </div>)}
        {current.some(i => i.is_checked) && <Button variant="outline" size="sm" onClick={() => remove()}>Clear ticked items</Button>}
      </section>
    </div>
  );
}