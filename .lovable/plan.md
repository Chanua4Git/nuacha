# Add Entry Date & Paid On Date to Payroll Log

## Goal
Track two new dates per weekly payroll entry:
- **Entry Date** — auto-populated when the week row is first saved (read-only in UI).
- **Paid On Date** — blank by default; the user fills it in directly inside the Payroll Log when the employee is actually paid, then saves.

## What the user will see

In **Payroll → Log → Weekly view**, two new columns appear on each week row:

| ... | Recorded | NIS Empr. | Total NIS | **Entry Date** | **Paid On** |
|---|---|---|---|---|---|
| ... | $1,324.70 | $150.60 | $225.90 | 2026-05-17 | _(date picker — empty)_ |

- Entry Date shows the timestamp the row was first saved (date only, read-only).
- Paid On is an inline date input. Picking a date + clicking a small Save icon (or blur) persists it. Empty = "Not paid yet" muted placeholder.
- Subtotal row leaves both columns blank.
- PDF export gets the two extra columns too. CSV export adds two columns at the end (non-breaking).

## Data model

Add two columns to `payroll_entries`:
- `entry_date date` — defaults to `CURRENT_DATE` on insert; never updated afterward.
- `paid_on_date date` — nullable; user-editable.

Existing rows: `entry_date` backfilled from `calculated_at::date` (or `created_at::date` fallback); `paid_on_date` stays null.

RLS unchanged (same row-level rules already applied to `payroll_entries`).

## Code changes

1. **Migration** — add the two columns + backfill + default.
2. **`useMonthlyPayrollPersistence.ts`**
   - `WeekSnapshot` gains `entryDate?: string` and `paidOnDate?: string | null`.
   - `loadWeeks` selects and returns both fields.
   - `saveWeek` no longer writes `entry_date` (DB default handles it); accepts optional `paidOnDate` and writes it when provided.
   - New `updatePaidOnDate(periodId, employeeId, weekNumber, date|null)` for the inline edit path so we don't rewrite the whole row.
3. **`PayrollLog.tsx` – `WeeklyView`**
   - Add two `<TableHead>` columns + two `<TableCell>`s per week row.
   - Paid On cell: `<Input type="date">` + tiny save button; on save call `updatePaidOnDate` then refetch/optimistically update the row.
   - Subtotal row spans the extra columns as empty.
4. **PDF export (`handleExportPDF`)** — add the two columns to the generated `<table>` header + body. Format dates as `YYYY-MM-DD`.
5. **CSV export** — append `Entry Date`, `Paid On Date` columns (kept at the end so existing importers keep working).
6. **Monthly view** — leave as-is (aggregated; per-week dates don't apply).

## Out of scope
- No changes to the Calculator tab, NI 184 breakdown row, or NIS computation.
- No reminders/notifications for unpaid weeks (could be a follow-up).
- No change to `payroll_periods.pay_date` (that stays the planned pay date).

## Acceptance
- Saving Angela's week of 2026-05-11 auto-stamps Entry Date = today.
- Paid On column is empty with a date picker; entering 2026-05-24 + Save persists it and survives reload.
- PDF and CSV exports include both new columns.
