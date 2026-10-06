# Monthly money check-in (with voice)

A calm monthly page for the Peltiers that answers four questions: what came in, what went out (and from which pot), what's left, and what still needs tidying. It adds a fourth way to log things, by voice, next to snap, upload and manual entry.

## 1. Your standard month, built in

Nuacha learns this routine and turns it into prompts:

- **Start of month: cash withdrawal.** Nuacha suggests a total from who's likely to be paid in cash: Basdeo, Schawn, the night nurse, the weekend nurses on alternate weekends (Carlene / Nikki), fill-ins, plus TT$500/week spending money. You adjust it, then confirm which account it came from.
- **Monthly transfer: Grandpa to Chan.** Recorded as a **transfer** between accounts, not spending, so Grandpa's balance goes down and Chan's goes up. Chan's account then covers:
  - Gas (about TT$250–300/week)
  - Flow, CLICO (insurance, life insurance, annuity)
  - T&TEC and WASA (every two months)
- **Backup account** is marked "emergencies only". Anything taken from it is flagged gently as one-off, separate from normal months.
- **Brother's help** is set to TT$0 expected from October. Whatever he sends is logged as it arrives, so you can clearly see whether the house sustains itself without him.
- **Garden Ohm business costs** (for example, paying Schawn TT$300 to groom for a workshop) can be logged as coming from Chan – Business.

## 2. Nurse roles (so suggestions make sense)

- **Angela:** the employed day nurse, paid by Grandpa.
- **Night nurse:** regular, with fill-ins when she's away.
- **Weekend nurses:** Carlene and Nikki alternate weekends, with fill-ins when unavailable.
- **Tricia and others:** fill-ins only, on the days you pick.

Each person gets a role tag, and the cash suggestion only counts people expected to work.

## 3. The check-in page (Cash & Accounts, "This month")

- **Came in:** Grandma, Grandpa (three deposits), Brother (as it arrives), Garden Ohm.
- **Went out, by pot:** withdrawals, transfers, wages and expenses.
- **Left in each pot.**
- **To tidy:** items with no "Paid from", cash not yet explained. Written as a short, soft list.

## 4. Voice check-in (both styles)

A **"Talk it through"** button sits beside Snap / Upload / Manual on the Add expense area and on the check-in page.

- **Guided:** short questions, one at a time, generated from your routine. For example:
  - "Did you take out the start-of-month cash? How much, from which account?"
  - "Did you move money from Grandpa to your account this month?"
  - "Any nurse fill-ins this week? Who, which days?"
  - "Did your brother send anything?"
  - "Any bills paid: Flow, CLICO, T&TEC, WASA?"
- **Just tell me:** one free voice note about the month.
- In both styles, Nuacha shows a **review card** of what it understood, such as "Withdrawal TT$6,000 from Grandma's pension, 2 Oct". Nothing saves until you tap **Save**, and every line can be edited or removed.

## 5. What stays the same

Past entries are not changed. "Who pays for what" still pre-fills "Paid from". Garden Ohm sync continues as is.

---

## Technical details

- **New table `account_transfers`:** from_account, to_account, amount, date, notes. It has owner-only access rules and explicit access grants. Account balances include transfers out (minus) and in (plus), still derived and never stored.
- **`employees`:** add `nurse_role` (day / night / weekend / fill_in / other) and `pays_in_cash` boolean. Seed the current staff from the roles above.
- **`money_accounts`:** add a `purpose` tag (living / wages / bills / emergency / business). Set Backup to emergency. Set Brother's expected income to 0.
- **New table `money_routines`:** monthly items (label, kind = withdrawal/transfer/bill, from/to account, amount estimate, frequency monthly/bi-monthly/weekly). Seeded with the routine above. Drives the prompts and cash suggestion.
- **Voice capture:** the browser's built-in speech-to-text where available (Chrome, Safari), with a typed fallback.
- **New edge function `money-voice-parse`:** takes the transcript plus the user's accounts, staff and routines, and uses the same AI service the receipt scanner uses to return structured items (withdrawal / transfer / expense / wage / income). It saves nothing. The client saves only after review, using the existing paid-from helpers.
- **Check-in page:** a new section on `/money` built from existing hooks plus transfers. A "To tidy" list comes from unlinked expenses and unexplained cash.
- **AGENTS.md:** a rule that transfers between own accounts are never expenses, and that voice parsing never writes without user confirmation.
