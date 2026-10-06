import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

// Turns a spoken/typed money check-in into suggested entries. It never saves anything:
// the app shows a review card and only writes after the user taps Save.

const Body = z.object({
  transcript: z.string().min(1).max(8000),
  today: z.string().max(10),
  family_id: z.string().uuid().optional(),
  period: z.enum(['today', 'few_days', 'week']).optional(),
  receipts: z.array(z.object({
    index: z.number().int().min(0).max(50),
    vendor: z.string().max(200).nullable(),
    date: z.string().max(10).nullable(),
    total: z.number().nullable(),
  })).max(30).optional(),
});

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['items', 'note'],
  properties: {
    note: { type: 'string', description: 'One short, warm sentence summarising what was understood, or what is unclear.' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['kind', 'amount', 'date', 'from_account_id', 'to_account_id', 'description', 'place', 'person', 'category_id', 'receipt_index'],
        properties: {
          kind: { type: 'string', enum: ['withdrawal', 'transfer', 'expense', 'income'] },
          amount: { type: 'number' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          from_account_id: { type: ['string', 'null'], description: 'Account money left (withdrawal, transfer, expense). Null if unknown.' },
          to_account_id: { type: ['string', 'null'], description: 'Account money went into (transfer, income). Null otherwise.' },
          description: { type: 'string' },
          place: { type: ['string', 'null'] },
          person: { type: ['string', 'null'], description: 'Person paid, if a wage paid in cash.' },
          receipt_index: { type: ['integer', 'null'], description: 'Index of the receipt (from context.receipts) this expense comes from, else null.' },
          category_id: { type: ['string', 'null'], description: 'For expenses only: best matching id from context.categories, following past_examples. Null if none fits or not an expense.' },
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Please sign in again.' }, 401);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Please sign in again.' }, 401);

    let parsed;
    try { parsed = Body.safeParse(await req.json()); } catch { return json({ error: 'Invalid request' }, 400); }
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { transcript, today, family_id, period, receipts = [] } = parsed.data;

    const [acc, emp, rt, cats, hist] = await Promise.all([
      supabase.from('money_accounts').select('id,name,purpose,account_last4').eq('is_active', true),
      supabase.from('employees').select('first_name,last_name,nurse_role,pays_in_cash,employment_type,daily_rate').eq('is_active', true),
      supabase.from('money_routines').select('label,kind,frequency,from_account_id,to_account_id,amount_estimate').eq('is_active', true),
      family_id ? supabase.from('categories').select('id,name').eq('family_id', family_id) : Promise.resolve({ data: [] as any[] }),
      family_id ? supabase.from('expenses').select('description,place,category').eq('family_id', family_id).neq('category', '').order('date', { ascending: false }).limit(150) : Promise.resolve({ data: [] as any[] }),
    ]);

    const catList = (cats.data ?? []) as { id: string; name: string }[];
    const catIds = new Set(catList.map((c) => c.id));
    const catName = new Map(catList.map((c) => [c.id, c.name]));
    // Past examples: "place / description -> category name", so the guess follows how this household already files things.
    const seen = new Set<string>();
    const examples = ((hist.data ?? []) as any[])
      .filter((e) => catIds.has(e.category))
      .map((e) => `${e.place || ''} / ${e.description || ''} -> ${catName.get(e.category)}`)
      .filter((s) => (seen.has(s) ? false : (seen.add(s), true)))
      .slice(0, 80);

    const context = {
      today,
      accounts: acc.data ?? [],
      people: (emp.data ?? []).map((e: any) => ({ name: `${e.first_name} ${e.last_name}`, role: e.nurse_role, cash: e.pays_in_cash, type: e.employment_type, daily_rate: e.daily_rate })),
      routines: rt.data ?? [],
      categories: catList,
      past_examples: examples,
      period: period ?? null,
      receipts,
    };


    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return json({ error: 'Voice check-in is not set up yet.' }, 500);

    const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        reasoning: { effort: 'low' },
        instructions:
          'You help a Trinidad & Tobago household log money. Read the check-in (questions and answers, or a free note) and return entries. ' +
          'Amounts are TT$. "Took out / withdrew" = withdrawal from an account. "Moved / transferred X to Y" between the user\'s own accounts = transfer (never an expense). ' +
          'Bills, gas, groceries, paying a person in cash = expense; set from_account_id to the account named, or the routine\'s usual account, else null. ' +
          'Money received (e.g. brother sent money) = income with to_account_id. Use account ids from context only. Dates: resolve relative words against today; default today. ' +
          'Skip answers like "no" or "nothing". Never invent amounts; skip an item if no amount was given. Keep descriptions short. period hints the time span (today / last few days / this week) for undated items. Receipts: every receipt in context.receipts must appear exactly once as an expense with receipt_index set. If the user spoke about the same purchase (same shop or clearly the same thing), merge into ONE item using the receipt total, receipt date and receipt vendor as place. Cash wages or purchases after an ATM withdrawal: set from_account_id to the account the cash came from if said. For each expense pick category_id from context.categories, copying how past_examples filed similar places/people (e.g. nurse wages, grass cutting, gas, groceries).',
        input: `Context:\n${JSON.stringify(context)}\n\nCheck-in:\n${transcript}`,
        text: { format: { type: 'json_schema', name: 'money_checkin', strict: true, schema } },
      }),
    });

    if (!res.ok) {
      const details = await res.text();
      console.error(`AI request failed [${res.status}]: ${details}`);
      const msg = res.status === 429 ? 'A lot is happening right now — please try again in a minute.'
        : res.status === 402 ? 'AI credits have run out for now.' : "I couldn't read that just now.";
      return json({ error: msg, status: res.status }, res.status);
    }
    const data = await res.json();
    const text = data.output_text
      ?? data.output?.flatMap((o: any) => o.content ?? []).find((c: any) => c.type === 'output_text')?.text;
    if (!text) return json({ error: "I couldn't understand that one — try saying it another way, or type it." }, 422);
    const out = JSON.parse(text);
    for (const it of out.items ?? []) { if (it.category_id && !catIds.has(it.category_id)) it.category_id = null; if (it.receipt_index != null && !receipts.some((r) => r.index === it.receipt_index)) it.receipt_index = null; }
    return json(out);
  } catch (e) {
    console.error(e);
    return json({ error: "Something went wrong reading that." }, 500);
  }
});
