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
  const [sightings, setSightings] = useState<{ id: string; item_name: string; store: string; price: number; seen_on: string }[]>([]);
  const [priceForm, setPriceForm] = useState({ item: '', store: '', price: '' });

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
              .select('id, description, expense_id, unit_price, total_price, quantity, expenses!inner(date, place, family_id)')
              .in('expenses.family_id', familyIds).order('id').range(offset, offset + 999);
            if (error) throw error;
            if (!active) return;
            for (const row of data || []) {
              lines.push({ description: row.description, date: row.expenses.date, place: row.expenses.place, price: Number(row.unit_price) || (row.total_price && row.quantity ? Number(row.total_price) / Number(row.quantity) : Number(row.total_price)) || null });
              receiptIds.add(row.expense_id);
            }
            if (!data || data.length < 1000) break;
          }
        }
        const { data: seen } = await supabase.from('shopping_price_sightings').select('id, item_name, store, price, seen_on').eq('user_id', user.id).order('seen_on');
        if (active) setSightings(seen || []);
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

  const addItems = async (entries: { name: string; store: string }[], stocked = false) => {
    if (!user || saving) return;
    const unique = entries.filter((entry, index, all) => entry.name.trim() && !onList.has(itemKey(entry.name)) && all.findIndex(e => itemKey(e.name) === itemKey(entry.name)) === index);
    if (!unique.length) return toast('Those items are already on this list.');
    const existing = new Map(current.map(i => [itemKey(i.name), i]));
    const revive = stocked ? [] : unique.map(e => existing.get(itemKey(e.name))).filter((i): i is Item => !!i);
    const fresh = unique.filter(e => !existing.has(itemKey(e.name)));
    if (!fresh.length && !revive.length) return toast('Those items are already on your complete list.');
    setSaving(true);
    if (revive.length) await supabase.from('shopping_list_items').update({ is_checked: false }).in('id', revive.map(i => i.id)).eq('user_id', user.id);
    const { error } = fresh.length ? await supabase.from('shopping_list_items').insert(fresh.map(entry => ({ user_id: user.id, list_name: list, name: entry.name.trim(), store: entry.store.trim() || null, is_checked: stocked }))) : { error: null };
    setSaving(false);
    if (error) return toast('That didn’t save — try again in a moment.');
    setName(''); setStore(''); setSelected(new Set());
    await load();
    toast(stocked ? `${fresh.length} past purchases saved to your complete list as “at home”.` : `${unique.length === 1 ? 'Item' : `${unique.length} items`} added to ${list}.`);
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
  useEffect(() => {
    if (!user || loading || receiptError || !hints.length) return;
    const have = new Set(items.map(i => itemKey(i.name)));
    const missing = hints.filter(h => !have.has(h.key));
    if (!missing.length) return;
    supabase.from('shopping_list_items').insert(missing.map(h => ({ user_id: user.id, list_name: 'Household', name: h.name, store: h.usualStore || null, is_checked: h.daysSince <= 14 || !h.due }))).then(({ error }) => { if (!error) load(); });
  }, [hints, loading]);
  const priceInfo = (name: string) => {
    const key = itemKey(name);
    const all: Record<string, number> = { ...(hints.find(h => h.key === key)?.storePrices || {}) };
    for (const s of sightings) if (itemKey(s.item_name) === key) all[s.store] = Number(s.price);
    const entries = Object.entries(all).sort((a, b) => a[1] - b[1]);
    return entries;
  };
  const priceLine = (name: string) => {
    const e = priceInfo(name);
    if (!e.length) return null;
    const best = e[0];
    const tie = e.filter(x => x[1] === best[1]).map(x => x[0]);
    return `${tie.length > 1 ? `Same price at ${tie.join(' & ')}` : `Best: ${best[0]}`} TT$${best[1].toFixed(2)}${e.length > 1 && tie.length < e.length ? ` · ${e.slice(tie.length).map(([st, p]) => `${st} TT$${p.toFixed(2)}`).join(' · ')}` : ''}`;
  };
  const savePrice = async () => {
    const price = Number(priceForm.price);
    if (!user || !priceForm.item.trim() || !priceForm.store.trim() || !(price > 0)) return toast('Add the item, store and price.');
    const { error } = await supabase.from('shopping_price_sightings').insert({ user_id: user.id, item_name: priceForm.item.trim(), store: priceForm.store.trim(), price });
    if (error) return toast('That didn’t save — please try again.');
    setPriceForm({ item: '', store: '', price: '' }); setRefresh(v => v + 1); toast('Price saved.');
  };
  const toGet = current.filter(i => !i.is_checked);
  const atHome = current.filter(i => i.is_checked).sort((a, b) => a.name.localeCompare(b.name));
  const missingHints = hints.filter(h => !current.some(i => itemKey(i.name) === h.key));
  const byStore = toGet.reduce<Record<string, Item[]>>((a, i) => { (a[i.store || 'Any store'] ||= []).push(i); return a; }, {});

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

      <section className="space-y-2 border-t border-border pt-5" aria-label="Shelf prices">
        <h2 className="text-lg font-playfair">Spotted a price?</h2>
        <p className="text-xs text-muted-foreground">Prices from your scans are added automatically. Add shelf tags here to compare stores.</p>
        <form className="flex flex-col sm:flex-row gap-2" onSubmit={e => { e.preventDefault(); savePrice(); }}>
          <Input value={priceForm.item} onChange={e => setPriceForm(f => ({ ...f, item: e.target.value }))} placeholder="Item (e.g. adult diapers)" aria-label="Price item" />
          <Input value={priceForm.store} onChange={e => setPriceForm(f => ({ ...f, store: e.target.value }))} placeholder="Store" aria-label="Price store" className="sm:w-36" />
          <Input value={priceForm.price} onChange={e => setPriceForm(f => ({ ...f, price: e.target.value }))} placeholder="TT$" inputMode="decimal" aria-label="Price" className="sm:w-24" />
          <Button type="submit" variant="outline">Save price</Button>
        </form>
      </section>

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
        {missingHints.length > 0 && <Button variant="outline" size="sm" disabled={saving} onClick={() => addItems(missingHints.map(h => ({ name: h.name, store: h.usualStore })), true)}><Sparkles className="h-4 w-4 mr-1" />Add all {missingHints.length} past purchases to my complete list</Button>}
        {current.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet — and that’s okay.</p>}
        {Object.entries(byStore).map(([s, its]) => <div key={s}>
          <h3 className="text-sm font-medium text-primary mb-1 break-words">{s}</h3>
          {its.map(i => <div key={i.id} className="flex items-center gap-3 py-1.5">
            <Checkbox checked={i.is_checked} onCheckedChange={() => toggle(i)} aria-label={`Got ${i.name}`} />
            <div className="flex-1 min-w-0">
              <span className={`break-words ${i.is_checked ? 'line-through text-muted-foreground' : ''}`}>{i.name}</span>
              {priceLine(i.name) && <p className="text-xs text-primary">{priceLine(i.name)}</p>}
              {hints.find(h => h.key === itemKey(i.name)) && <p className="text-xs text-muted-foreground">Last bought {dateLabel(hints.find(h => h.key === itemKey(i.name))?.lastDate || '')}</p>}
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(i.id)} aria-label={`Remove ${i.name}`} title={`Remove ${i.name}`}><Trash2 className="h-4 w-4" /></Button>
          </div>)}
        </div>)}
        {toGet.length === 0 && current.length > 0 && <p className="text-sm text-muted-foreground">Nothing to get right now — you’re all stocked.</p>}
        {atHome.length > 0 && <div className="border-t border-border pt-4 space-y-1">
          <h3 className="text-sm font-medium">At home · your complete list ({atHome.length})</h3>
          <p className="text-xs text-muted-foreground">Ticked items stay here. Tap “Need it” when you’re running low.</p>
          {atHome.map(i => <div key={i.id} className="flex items-center gap-2 py-1">
            <span className="flex-1 min-w-0 break-words text-muted-foreground">{i.name}{i.store ? <span className="text-xs"> · {i.store}</span> : null}{priceLine(i.name) && <span className="block text-xs text-primary">{priceLine(i.name)}</span>}</span>
            <Button size="sm" variant="outline" onClick={() => toggle(i)}>Need it</Button>
            <Button size="icon" variant="ghost" onClick={() => remove(i.id)} aria-label={`Remove ${i.name}`} title={`Remove ${i.name}`}><Trash2 className="h-4 w-4" /></Button>
          </div>)}
        </div>}
      </section>
    </div>
  );
}