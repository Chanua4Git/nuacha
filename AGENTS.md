# Architecture rules

- Generate social-story images entirely in the authenticated browser and download them as temporary PNG blobs, because private receipt media must never be republished or persisted for sharing.- Derive an account's available balance from its last known balance plus later withdrawals (a slip's printed balance overrides), rather than storing a running total, so edits never drift.
- Sync external business income (e.g. Garden Ohm orders) into business_income keyed by source + external order ID, and never count it as an expense, so re-sends update instead of duplicating.
- Pre-fill "Paid from" on new wages/expenses from paid_from_defaults (employee, then place, then category); defaults never rewrite existing entries, so past records stay as logged.
- Record money moved between the user's own accounts in account_transfers and fold it into derived balances; transfers are never expenses.
- Voice/typed money check-ins are parsed server-side into suggestions only; the app writes entries solely after the user reviews and taps Save.
- Keep guest Talk-it-through drafts (note + receipt photos) only in the browser until sign-in; nothing is uploaded or parsed before then, because parsing and storage require an authenticated user.
- Manual-number admin nudges open WhatsApp drafts without creating users or delivery records, because opening a draft does not prove a message was sent.
- Setup checkout routes fixed-price packages to their own invoices after location and calendar selection, stores one approved meeting place for in-person requests, shows Google's supported public booking embed with an external fallback, and keeps requests separate from payment and calendar confirmations; admin deletion removes only the request, not payments or appointments.
- Generate Learning module social videos entirely in the browser from generic lesson content, because downloads should be immediate and must never include private user data.
- Receipt dates travel as calendar strings (YYYY-MM-DD) from the receipt reader through the app and are read only via the shared calendar-date helper, never as timestamps or `new Date(isoString)`, so time zones can't shift the day.
- After Talk-it-through saves expenses, send the user to Expenses with the new entry IDs in the link so they can see and highlight what was just added.

- Scanned receipt dates pass through a per-store day/month memory (learned when the user saves a flipped date) and a future-date sense check, so till formats that confuse the reader self-correct.
- A long receipt's total comes from the section that shows the printed total, otherwise from the deduplicated item sum, never from whichever section the reader felt surest about, so multi-photo totals stay right.
- Long-receipt sections are joined by dropping only the run of lines where one photo overlaps the next, never by removing every look-alike line, so genuine repeats (4 × Red Pear) stay counted.
