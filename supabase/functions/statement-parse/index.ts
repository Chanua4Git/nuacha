import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

// Reads bank / credit-card statement screenshots into suggested transactions.
// Never saves: the app shows a review list and writes only after the user taps Save.

const Body = z.object({
  images: z.array(z.string().startsWith('data:image/').max(8_000_000)).min(1).max(8),
  family_id: z.string().uuid().optional(),
  today: z.string().max(10),
});

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['card_last4', 'note', 'transactions'],
  properties: {
    card_last4: { type: ['string', 'null'], description: 'Last 4 digits of the card/account if visible.' },
    note: { type: 'string', description: 'One short, warm sentence about what was read.' },
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['date', 'description', 'place', 'amount', 'kind', 'category_id'],
        properties: {
          date: { type: 'string', description: 'Transaction date YYYY-MM-DD' },
          description: { type: 'string', description: 'Short, clean description, e.g. "Amazon Prime subscription".' },
          place: { type: 'string', description: 'Clean merchant name, e.g. "PriceSmart".' },
          amount: { type: 'number', description: 'Positive TT$ amount.' },
          kind: { type: 'string', enum: ['charge', 'fee', 'payment', 'refund'] },
          category_id: { type: ['string', 'null'], description: 'Best id from context.categories for charges/fees, else null.' },
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
    if (!parsed.success) return json({ error: 'Those images could not be read — try fewer or smaller screenshots.' }, 400);
    const { images, family_id, today } = parsed.data;

    const cats = family_id
      ? ((await supabase.from('categories').select('id,name').eq('family_id', family_id)).data ?? [])
      : [];
    const catIds = new Set(cats.map((c: any) => c.id));

    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return json({ error: 'Statement reading is not set up yet.' }, 500);

    const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        reasoning: { effort: 'low' },
        store: false,
        instructions:
          'You read Trinidad & Tobago bank or credit-card statement screenshots (mobile banking apps). List every transaction line exactly once, ' +
          'even if screenshots overlap (same date + amount + merchant appearing in two images = one transaction). Amounts are TT$, always positive. ' +
          'kind: purchases = charge; late/NSF/interest/annual fees = fee; payments to the card (incl. "ACH payment") = payment; credits, reversals of charges = refund. ' +
          'A reversed payment ("REV ACH") is kind payment with the note mentioning it. Dates: use the transaction date (not posting) when both show; ' +
          `infer the year from context, never in the future of ${today}. Format YYYY-MM-DD. Clean merchant names (drop card numbers, city codes, "POS"). ` +
          'Pick category_id only from context.categories.',
        input: [{
          role: 'user',
          content: [
            { type: 'input_text', text: `Context:\n${JSON.stringify({ today, categories: cats })}` },
            ...images.map((url) => ({ type: 'input_image', image_url: url })),
          ],
        }],
        text: { format: { type: 'json_schema', name: 'statement', strict: true, schema } },
      }),
    });

    if (!res.ok) {
      console.error(`AI request failed [${res.status}]: ${await res.text()}`);
      const msg = res.status === 429 ? 'A lot is happening right now — please try again in a minute.'
        : res.status === 402 ? 'AI credits have run out for now.' : "I couldn't read that statement just now.";
      return json({ error: msg }, res.status);
    }
    const data = await res.json();
    const text = data.output_text
      ?? data.output?.flatMap((o: any) => o.content ?? []).find((c: any) => c.type === 'output_text')?.text;
    if (!text) return json({ error: "I couldn't read those screenshots — try clearer ones." }, 422);
    const out = JSON.parse(text);
    for (const t of out.transactions ?? []) if (t.category_id && !catIds.has(t.category_id)) t.category_id = null;
    return json(out);
  } catch (e) {
    console.error(e);
    return json({ error: 'Something went wrong reading that statement.' }, 500);
  }
});
