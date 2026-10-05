# Bring Garden Ohm order money into Nuacha automatically

Every **delivered** Garden Ohm order, from the very first one, shows up in Nuacha as money received. Each one counts toward either the Garden Ohm bank account or a new "Garden Ohm cash in hand" pot, so Cash & Accounts shows the whole business picture.

## How it works

```text
Garden Ohm admin                       Nuacha
order marked Delivered  --->  receives the order (private key checked)
(+ one-time send of           saves it once (no duplicates)
 all past delivered orders)   adds it to Bank or Cash in hand
                              shows it in Cash & Accounts
```

- **New orders:** when an order is marked Delivered in Garden Ohm, it's sent to Nuacha within seconds. If it's edited later (amount, payment method), Nuacha updates the same entry instead of adding a second one.
- **Past orders:** a one-time "send all delivered orders" button in Garden Ohm admin. It's safe to press twice because duplicates are skipped.
- **Cash vs bank:**
  - If the order says cash, it goes to "Garden Ohm cash in hand".
  - If it says bank transfer, WiPay, or card, it goes to "Chan – Business (Garden Ohm)".
  - Older orders with no payment method are marked "Not sure yet". You can tap the tag to choose Cash or Bank, the same way as the "Paid from" tags today.

## What you'll see in Nuacha

- **Cash & Accounts:**
  - A new "Garden Ohm" section showing money in this month: cash, bank, and not sure yet.
  - The new "Garden Ohm cash in hand" pot, which goes up with cash orders and down when you spend it.
- **Money in list:** each order shows its date, customer first name, order number, amount, and a cash/bank tag. It can be filtered by month.
- **Monthly and yearly totals** for Garden Ohm income, ready for reports.
- Garden Ohm orders are kept separate from household expenses, so they never count as spending.

## What I need from you

1. **A private key:** I'll create one in Nuacha. You then save the same key in the Garden Ohm project, which I'll guide you through.
2. **One small change in the Garden Ohm project:** I can't open that project from here. I'll give you a short ready-made instruction to paste into Garden Ohm's Lovable chat. It adds the automatic send on Delivered plus the "send all past delivered orders" button.

## Technical details

- New table `business_income`: user_id, source ('garden_ohm'), external_order_id (unique per source), order_number, customer_name, amount, currency, payment_method_raw, channel ('cash' | 'bank' | 'unknown'), account_id (money_accounts), delivered_on, raw jsonb, timestamps. GRANTs plus owner-only row access rules.
- New edge function `garden-ohm-income` (verify_jwt false): checks the `x-nuacha-key` header against the `GARDEN_OHM_SYNC_KEY` secret, validates the body with Zod (a single order or a batch of up to 500), and upserts on (source, external_order_id). Orders go to the owner (chanuajohnson4@gmail.com), using the stored user_id.
- New money account "Garden Ohm cash in hand" for The Peltier's household.
- Account balance rule extended: available = last known balance − later withdrawals + later income received into that account. Rows saved before the balance date are ignored, so the slip figure still wins.
- `useMoneyPots.ts` loads `business_income`; `MoneyPots.tsx` gets the Garden Ohm section; a new `IncomeChannelBadge` handles tap-to-change.
- The Garden Ohm-side instruction covers: an edge function or database trigger that sends to the Nuacha function URL when status becomes delivered, plus an admin backfill button that sends batches of all delivered orders. The key is stored there as a secret.
- An `AGENTS.md` rule records that business income is synced in by order ID and never counted as an expense.
