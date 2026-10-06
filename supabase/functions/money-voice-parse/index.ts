import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

// Turns a spoken/typed money check-in into suggested entries. It never saves anything:
// the app shows a review card and only writes after the user taps Save.

const Body = z.object({
  transcript: z.string().min(1).max(8000),
  today: z.string().max(10),
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
        required: ['kind', 'amount', 'date', 'from_account_id', 'to_account_id', 'description', 'place', 'person'],
        properties: {
          kind: { type: 'string', enum: ['withdrawal', 'transfer', 'expense', 'income'] },
          amount: { type: 'number' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
          from_account_id: { type: ['string', 'null'], description: 'Account money left (withdrawal, transfer, expense). Null if unknown.' },
          to_account_id: { type: ['string', 'null'], description: 'Account money went into (transfer, income). Null otherwise.' },
          description: { type: 'string' },
          place: { type: ['string', 'null'] },
          person: { type: ['string', 'null'], description: 'Person paid, if a wage paid in cash.' },
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
    const { transcript, today } = parsed.data;

    const [acc, emp, rt] = await Promise.all([
      supabase.from('money_accounts').select('id,name,purpose,account_last4').eq('is_active', true),
      supabase.from('employees').select('first_name,last_name,nurse_role,pays_in_cash').eq('is_active', true),
      supabase.from('money_routines').select('label,kind,frequency,from_account_id,to_account_id,amount_estimate').eq('is_active', true),
    ]);

    const context = {
      today,
      accounts: acc.data ?? [],
      people: (emp.data ?? []).map((e: any) => ({ name: `${e.first_name} ${e.last_name}`, role: e.nurse_role, cash: e.pays_in_cash })),
      routines: rt.data ?? [],
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
          'Skip answers like "no" or "nothing". Never invent amounts; skip an item if no amount was given. Keep descriptions short.',
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
    return json(JSON.parse(text));
  } catch (e) {
    console.error(e);
    return json({ error: "Something went wrong reading that." }, 500);
  }
});
