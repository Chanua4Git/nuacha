# Fix Payroll Log Import — "Most months not displaying"

## What's actually happening

Looking at the database, the import is broken in 3 ways. That's why you see **0 imported · 57 skipped · 10 failed**, only **2 entries** in the DB across 57 periods, duplicate "January 2026" rows, and start dates like `2024-01-05` for a January 2026 sheet.

### Root causes

1. **Unique constraint blocking weekly rows.** `payroll_entries` has `UNIQUE (payroll_period_id, employee_id)`. The importer tries to insert 4–5 weeks per month for Angela in one batch — the unique constraint rejects every week after the first, the whole `insert([...])` call errors atomically, and **zero** entries get saved. The period row stays behind (no transaction rollback), so the log shows the month header with no rows underneath.

2. **Date parsing produces wrong years.** Several periods landed at `2024-01-05` etc. Cells stored as Excel serial numbers / strings get misread, putting "January 2026" into 2024. This also breaks the dedup check (next item).

3. **Dedup key derives `monthKey` from the (wrong) `start_date`.** On re-runs the importer compares the sheet's real monthKey (`2026-01`) to what's in the DB (`2024-01`), thinks the month isn't imported, and creates a duplicate period.

Combined effect: previous runs left ~57 empty periods + 10 failures + duplicates. Today's run says "skipped 57" because those broken periods are now blocking re-import.

## Fix plan

### 1. Database migration — replace the unique constraint
```text
DROP UNIQUE (payroll_period_id, employee_id)
ADD  UNIQUE (payroll_period_id, employee_id, week_number)
```
This matches the existing `useMonthlyPayrollPersistence` upsert (`onConflict: 'payroll_period_id,employee_id,week_number'`) and lets weekly rows coexist.

### 2. Cleanup of broken import data (one-shot, scoped)
Delete only the previously imported rows for Angela so we can re-run cleanly:
- Delete from `payroll_periods` where `user_id = <you>` AND `import_source LIKE 'xlsx_import_%'`
- Cascades to entries via FK

This **only touches imported history**, never your weekly calculator data.

### 3. Fix the importer (`PayrollLogImporter.tsx`)
- **Dedup key** — use `import_source + monthKey` stored explicitly (add `notes` or reuse `name`), not `start_date`. Track seen months by `(import_source, sheet.monthKey)`.
- **Dates** — improve `toISO` to:
  - Trust `cellDates: true` Date objects directly (no toISOString — use UTC y/m/d to avoid timezone shift).
  - Handle 2-digit year strings.
  - Fall back to deriving year/month from the sheet name when a row's date year disagrees by >1 year (catches Excel epoch glitches).
- **Insert entries one row at a time with upsert** on the new conflict key, so a single bad row doesn't kill the whole month.
- **Show per-sheet errors** in the UI (currently you only see a count) — list which months failed and why.

### 4. UI: re-import button + progress
- Add a "Clear previous import & re-run" button in the importer card (calls a small RPC or a scoped delete + re-import).
- Show parsed-vs-saved counts per sheet so you can spot any month that still misbehaves.

## Out of scope
- No changes to the weekly Calculator or NIS edge function.
- No schema changes to `payroll_periods` beyond what already exists.

## Files touched
- `supabase/migrations/<new>.sql` — drop+add unique constraint, scoped cleanup of `xlsx_import_*` periods for the current user.
- `src/components/payroll/PayrollLogImporter.tsx` — dedup, date parsing, per-row upsert, per-sheet error list, "clear & re-run" button.
- (No changes to `useEmployeePayrollHistory` or `PayrollLog.tsx` — once entries actually exist, the log will populate.)

## What you'll do after approval
1. Approve the migration (drops the bad constraint + clears the 57 broken imported periods for Angela).
2. Open Payroll → Log → re-upload the same .xlsx → click Import.
3. You should see ~67 months with 4–5 weeks each populated.

Approve and I'll implement.
