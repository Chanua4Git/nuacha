# Personal Talk it through prompts for signed-in people

## Goal
Visitors keep the generic guide. Signed-in people get prompts and examples built only from their own records, so they know exactly what to say next. Your current owner-specific questions (nurses, brother, Garden Ohm, cash plan) stay as they are for you.

## What signed-in people will see
1. **"Try saying" examples made from their own data** — e.g. "Spent 320 at Massy, paid Tricia 83 for last night, from the Grandma account." Built from their top 3 places, people they pay (staff), accounts and households.
2. **"What's next" nudges** (1–2 chips above the text box), picked from their patterns:
   - A regular place not logged for longer than usual ("Groceries usually weekly — anything this week?")
   - Staff pay due by their pay cadence and not yet logged
   - Monthly bills from their bill tracker still unpaid this month
   - A budget category close to its limit (gentle wording, no warnings)
   - An account without a recent balance ("Want to update the Backup balance?")
   Tapping a chip puts a starter sentence in the text box.
3. **Monthly questions** use their real account and people names when they have them; generic otherwise.
4. **New signed-in users with no records** get the generic guide plus one prompt: "Start with one thing you bought today."

## Privacy
- Everything is read with the signed-in person's own access, so it only ever includes their records. Nothing personal is built or shown before sign-in.
- Visitors and guest drafts keep the current generic text exactly.
- No new data is stored; prompts are worked out on the spot.

## Technical details
- New hook `src/hooks/usePersonalPrompts.ts`: when a session exists, fetch (owner RLS-scoped) last 90 days of expenses (place, category, amount, date, payment), employees + recent payroll_entries, money_accounts (known_balance_date), monthly_recurring_payments for current month, budgets vs spend. Compute top places/people/accounts, cadence gaps (median interval vs days since last), unpaid bills, budget ≥85%. Return `{ examples: string[], nudges: {label, starter}[] }`; memoised, react-query cached 5 min.
- `VoiceCheckIn.tsx`: if signed in and hook has data, replace the generic placeholder/example with personal ones and render nudge chips; keep `OWNER_EMAIL` branches unchanged. Monthly step placeholders use first account/person names when available.
- No database changes. Gentle, non-shaming copy throughout.
- Verify in the preview as a visitor (generic only) and signed in as you (personal prompts).
