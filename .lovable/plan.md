# Fix "Could not save Week 2" upsert error

## Problem
Saving a week in the Payroll Calculator fails with:
`code 42P10 — there is no unique or exclusion constraint matching the ON CONFLICT specification`

The frontend upserts with `onConflict: 'payroll_period_id,employee_id,week_start_date'`. A unique index on those three columns does exist (`payroll_entries_period_employee_week_start_key`), but it is a **partial** index (`WHERE week_start_date IS NOT NULL`). PostgREST cannot infer a partial index for ON CONFLICT, so Postgres rejects the upsert.

## Fix (one migration)

1. Backfill any rows where `week_start_date IS NULL` (defensive — set to the first day of that entry's period month, or delete if no period). Verify count first.
2. Add `NOT NULL` to `payroll_entries.week_start_date`.
3. Drop the partial index `payroll_entries_period_employee_week_start_key`.
4. Create a real **UNIQUE CONSTRAINT** `payroll_entries_period_employee_week_start_key` on `(payroll_period_id, employee_id, week_start_date)` — non-partial, fully inferable by PostgREST.

No frontend changes needed — the existing `onConflict` string already matches.

## Verification
After migration: try saving Week 2 in the Calculator. Should succeed without 400 / 42P10. Existing Angela rows remain intact.
