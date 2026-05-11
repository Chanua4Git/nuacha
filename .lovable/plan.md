# Persistent Weekly Payroll Entry (Monthly Period)

## Goal
When you calculate Week 1 of May, click **Save Week**, and come back next week to enter Week 2 — Week 1's values are still there, untouched. Each week saves independently to the database (not just sessionStorage), so it survives sign-outs, devices, and browser clears. At month-end, **Save Payroll Period** finalizes the whole month.

## How it will work (user flow)

1. **Setup Period** → pick a calendar month (e.g. May 2026). The calculator builds 4 or 5 Monday-anchored week rows automatically.
2. The system auto-loads any previously saved weeks for that month + employee, so Week 1's Days Worked / Recorded Pay reappear exactly as you left them.
3. Each week row gets two new buttons:
   - **Save Week** → writes that single week's values to the database (upsert).
   - **Clear Week** → resets that one row's inputs to 0 (other weeks untouched). If a saved DB record exists, it's also zeroed there.
4. A small **Saved ✓ / Unsaved •** indicator on each row shows whether your current values match what's in the database.
5. **Save Payroll Period** at the bottom remains as today — it finalizes the whole month (status: calculated/paid) and rolls the saved weeks into the period totals.

## Period model
- One `payroll_periods` row per **employee + calendar month** (e.g. "May 2026 — A N-Collymore"), created lazily the first time you save a week in that month.
- Status starts as `draft`. Becomes `calculated`/`paid` when you click Save Payroll Period.
- Period dates = first Monday of month → last Sunday covered by the month's Mondays.

## Week storage
Use the existing `payroll_entries` table (already has `week_number`, `week_start_date`, `week_end_date`, `recorded_pay`, etc.). One row per week, linked to the monthly period + employee.

## Technical changes

**Database (migration)**
- Add unique constraint on `payroll_entries (payroll_period_id, employee_id, week_number)` to support upsert.
- No new tables required.

**New hook: `useMonthlyPayrollPeriod(employeeId, year, month)`**
- `getOrCreatePeriod()` — finds/creates the draft period for that employee+month.
- `loadWeekEntries()` — fetches saved `payroll_entries` for the period.
- `saveWeek(weekNumber, data)` — upsert one week's row (days_worked, recorded_pay, gross_pay, NIS employee/employer, net_pay, week_start/end).
- `clearWeek(weekNumber)` — upsert with zeros (keeps the row, resets values).

**`EnhancedPayrollCalculator.tsx`**
- Replace the "custom date range" Setup with a **Month + Year picker** (reuse the dialog pattern from `Ni184MonthlyExportDialog`).
- On mount / when employee+month change: call `loadWeekEntries()` and hydrate `weeklyInputs` + `payrollPeriod.weeks` from DB instead of sessionStorage.
- Keep sessionStorage as a transient cache for unsaved edits only.
- Add **Save Week** + **Clear Week** buttons in the Actions column next to the existing **Calculate** button.
- Add saved/unsaved badge per row by diffing current input vs last-loaded DB value.
- "Save Payroll Period" button keeps working — it just updates the existing draft period to `calculated`/`paid` and writes totals.

**Files touched**
- `supabase/migrations/...` — unique constraint
- `src/hooks/useMonthlyPayrollPeriod.ts` (new)
- `src/components/payroll/EnhancedPayrollCalculator.tsx` (Setup tab → month picker; Weekly Calculator → Save/Clear Week + indicator + DB hydrate)

## Out of scope
- Multi-employee monthly view (still one employee at a time).
- Changing the Summary & Export or NI 184 CSV logic — they continue to read from the same period/entries.
