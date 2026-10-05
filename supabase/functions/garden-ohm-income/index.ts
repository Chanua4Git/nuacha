import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

// Owner of the Garden Ohm business inside Nuacha and the two money pots orders land in.
const OWNER_USER_ID = '27182ba6-fe5d-431e-9302-c0c7e71597c0';
const BANK_ACCOUNT_ID = '5cff4ccf-add6-4c55-be6c-49811881c0c1'; // Chan – Business (Garden Ohm)
const CASH_ACCOUNT_ID = '83a5ec39-ee68-46d8-96bc-0bad469b3618'; // Garden Ohm cash in hand

const Order = z.object({
  order_id: z.union([z.string(), z.number()]).transform(String),
  order_number: z.union([z.string(), z.number()]).transform(String).optional().nullable(),
  customer_name: z.string().max(200).optional().nullable(),
  amount: z.coerce.number().min(0),
  currency: z.string().max(10).optional().nullable(),
  payment_method: z.string().max(100).optional().nullable(),
  delivered_on: z.string().max(40).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
});
const Body = z.union([z.object({ orders: z.array(Order).min(1).max(500) }), Order]);

function channelFor(method?: string | null): 'cash' | 'bank' | 'unknown' {
  const m = (method ?? '').toLowerCase();
  if (!m) return 'unknown';
  if (m.includes('cash') || m.includes('cod')) return 'cash';
  if (/(bank|transfer|wipay|card|visa|master|online|paypal|linx|deposit)/.test(m)) return 'bank';
  return 'unknown';
}

const firstName = (n?: string | null) => (n ?? '').trim().split(/\s+/)[0] || null;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);
  const expected = Deno.env.get('GARDEN_OHM_SYNC_KEY');
  if (!expected || req.headers.get('x-nuacha-key') !== expected) return json({ error: 'Unauthorized' }, 401);

  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const orders = 'orders' in parsed.data ? parsed.data.orders : [parsed.data];

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Respect manual cash/bank choices made in Nuacha.
  const ids = orders.map((o) => o.order_id);
  const { data: existing } = await supabase
    .from('business_income')
    .select('external_order_id, channel, account_id, channel_locked')
    .eq('source', 'garden_ohm')
    .in('external_order_id', ids);
  const locked = new Map((existing ?? []).filter((r) => r.channel_locked).map((r) => [r.external_order_id, r]));

  const rows = orders
    .filter((o) => !o.status || o.status.toLowerCase().includes('deliver'))
    .map((o) => {
      const keep = locked.get(o.order_id);
      const channel = keep ? keep.channel : channelFor(o.payment_method);
      const account_id = keep ? keep.account_id : channel === 'cash' ? CASH_ACCOUNT_ID : channel === 'bank' ? BANK_ACCOUNT_ID : null;
      return {
        user_id: OWNER_USER_ID,
        source: 'garden_ohm',
        external_order_id: o.order_id,
        order_number: o.order_number ?? null,
        customer_name: firstName(o.customer_name),
        amount: o.amount,
        currency: o.currency || 'TTD',
        payment_method_raw: o.payment_method ?? null,
        channel,
        channel_locked: !!keep,
        account_id,
        delivered_on: o.delivered_on ? o.delivered_on.slice(0, 10) : null,
        raw: o,
      };
    });

  if (rows.length === 0) return json({ saved: 0, skipped: orders.length });
  const { error } = await supabase.from('business_income').upsert(rows, { onConflict: 'source,external_order_id' });
  if (error) return json({ error: error.message }, 500);
  return json({ saved: rows.length, skipped: orders.length - rows.length });
});
