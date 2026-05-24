## What's happening

Two different code paths create monthly `payroll_periods` rows with **different names** for the same month:

- **Importer (Excel)** → `name = "May 2026"` (no employee suffix), one period shared across employees.
- **Calculator** (`useMonthlyPayrollPersistence`) → `name = "May 2026 — A N-Collymore"`, one period per employee.

`getOrCreatePeriod` looks up the period by **exact name**. So when you opened the Calculator for Angela in May, it didn't find the importer's "May 2026" period that already held her week-1 (2026‑05‑04) row — it created a brand‑new "May 2026 — A N‑Collymore" period and started numbering from week 1 again.

DB confirms it. For Angela in May 2026:

```
Period "May 2026"                    week 1 = 2026-05-04  ($840 saved)
                                     week 2 = 2026-05-11  (zeros)
                                     week 3 = 2026-05-18  (zeros)   ← "disappearing" week
                                     week 4 = 2026-05-25  (zeros)
Period "May 2026 — A N-Collymore"    week 1 = 2026-05-18  ($1,400 saved) ← duplicate Monday
```

That's why the log shows **two rows for 2026‑05‑18** and why saving a later week in the calculator appears to "blank out" an earlier one: the calculator's `(period, employee, week_number)` upsert is operating on the *new* period while the importer's rows live in the *old* period — so each new save adds a row under the new period that visually replaces the same Monday's row from the old period in the sorted log.

A secondary issue compounds this: `week_number = index + 1` from `eachWeekOfInterval(periodStart, periodEnd)` is **not stable** — picking a different periodStart in the Calculator shifts every Monday to a new week_number, and upserts then overwrite the wrong row.

## Fix

### 1. Robust period lookup in `useMonthlyPayrollPersistence.getOrCreatePeriod`
Stop relying on exact-name match. Look up any `payroll_periods` row for this user whose **`start_date` falls in the same (year, month)** as the requested month, in this preference order:
1. A period with the importer-style name `"<Month> <Year>"`.
2. Any period in that month already having entries for this employee.
3. Any period in that month.
4. Otherwise create the per-employee period as today.

This makes the Calculator reuse whatever period the Importer (or a prior session) already created.

### 2. Stable week identity — upsert by `week_start_date` not `week_number`
- New migration: add unique index `payroll_entries_period_employee_week_start_key` on `(payroll_period_id, employee_id, week_start_date)`.
- `saveWeek` upsert uses `onConflict: 'payroll_period_id,employee_id,week_start_date'`. `week_number` is still written (recomputed as Monday-of-month index 1–5 so it's reproducible) but is no longer the conflict key.
- `clearWeek` unchanged (still calls saveWeek).

### 3. One-time cleanup migration for Angela's duplicates (and any equivalent)
For each `(employee_id, week_start_date)` that has >1 entry across periods for the same calendar month:
- Keep the row with the highest `gross_pay + recorded_pay` (preserves the saved $1,400 row).
- Move/keep it under the earliest period for that month (so all weeks live in one period).
- Delete the zero-valued duplicate.

After cleanup, May for Angela will have exactly 4 rows: 05‑04, 05‑11, 05‑18 ($1,400), 05‑25 — all under a single period.

### 4. Calculator week generation — keep current `eachWeekOfInterval` but compute `week_number` from Monday-of-month (1st Monday = 1, 2nd = 2, …) so the same Monday always gets the same number, regardless of `periodStart`.

## Technical notes

- Files changed: `src/hooks/useMonthlyPayrollPersistence.ts`, `src/components/payroll/EnhancedPayrollCalculator.tsx` (week_number calc only), one new SQL migration.
- No UI changes — Log/Calculator render the same; just the underlying data stops fragmenting.
- Importer logic untouched; it keeps creating "May 2026" periods, which the Calculator will now reuse.

## Acceptance

- Reload Logs → Angela May 2026 shows 4 rows (no 05‑18 duplicate); 05‑18 keeps the $1,400 entry.
- Open Calculator for Angela May, save week 2 → week 3's saved values remain in the Log.
- Save week 3 → week 2 remains. Both new and existing rows live in the same period.
