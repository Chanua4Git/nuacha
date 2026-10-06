# Architecture rules

- Generate social-story images entirely in the authenticated browser and download them as temporary PNG blobs, because private receipt media must never be republished or persisted for sharing.- Derive an account's available balance from its last known balance plus later withdrawals (a slip's printed balance overrides), rather than storing a running total, so edits never drift.
- Sync external business income (e.g. Garden Ohm orders) into business_income keyed by source + external order ID, and never count it as an expense, so re-sends update instead of duplicating.
- Pre-fill "Paid from" on new wages/expenses from paid_from_defaults (employee, then place, then category); defaults never rewrite existing entries, so past records stay as logged.
