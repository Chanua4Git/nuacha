## Goal

On the Weekly Calculator row, let you record holiday days separately from regular days and pick a multiplier (1.5x or 2x) for them, so the calculated pay properly reflects Trinidad & Tobago holiday premiums (e.g. Jun 19 holiday).

## What changes on the UI

In the Weekly Calculator table (Enhanced Payroll Calculator), the **Days Worked** cell becomes a small group of three inputs stacked compactly in the same column:

```text
Days Worked
[ Regular ]  e.g. 4
[ Holiday ]  e.g. 1
[ x1.5 | x2 ]  segmented toggle, no default selected
```

- If Holiday > 0 and no multiplier picked, show a soft inline hint: "Pick 1.5x or 2x for the holiday day(s)" and block save until chosen.
- "Total days" shown as muted text below: `Total: 5.0 (4 reg + 1 hol @1.5x)`.
- All other columns (Pay/(8hr)dy, Calculated Pay, NIS, Calc Pay less NIS, Recorded Pay) stay where they are.

## Calculation

```text
regularPay  = regularDays  * dailyRate
holidayPay  = holidayDays  * dailyRate * multiplier   // 1.5 or 2
gross_pay   = regularPay + holidayPay
hours_worked = (regularDays + holidayDays) * 8        // for NIS class lookup
```

NIS employee/employer contributions are then computed from `gross_pay` exactly as today via `calculatePayroll(...)` — no change to NIS logic itself. `Calc Pay less NIS = gross_pay - nis_employee`.

For your Jun 15–19 week with daily rate $280:
- 4 reg + 1 holiday @1.5x → 4*280 + 1*280*1.5 = $1,120 + $420 = **$1,540 gross**
- 4 reg + 1 holiday @2x → 4*280 + 1*280*2 = $1,120 + $560 = **$1,680 gross**

(Your earlier 4.5 entry produced 4.5 * $280 = $1,260 gross, which is why "Calc Pay less NIS" landed around $1,194.70 instead of $1,054.70 — the 4.5 trick under-pays the holiday. The new fields fix this.)

## Persistence

Add three new columns to `payroll_entries`:
- `regular_days` numeric
- `holiday_days` numeric
- `holiday_multiplier` numeric (1.5 or 2, nullable)

`days_worked` keeps storing the **total** (regular + holiday) so existing reports, exports, and the Log view keep working unchanged. The breakdown is loaded back into the row when you reopen a saved week.

## Files touched

- `supabase/migrations/<new>.sql` — add the 3 columns to `payroll_entries` (nullable, default null; no data backfill needed — existing rows simply have no holiday split).
- `src/components/payroll/EnhancedPayrollCalculator.tsx` — extend `weeklyInputs` state with `regularDays`, `holidayDays`, `holidayMultiplier`; update the Days Worked cell UI, the snapshot computation, save payload, and load-from-DB hydration.
- `src/integrations/supabase/types.ts` — regenerated after migration approval.
- No change to `PayrollCalculator.tsx` / `UnifiedPayrollCalculator.tsx` for now (this is scoped to the Enhanced Weekly Calculator you're using). Happy to extend to the others in a follow-up.

## Out of scope

- Per-day (Mon–Sun) breakdown — not needed given your choice.
- Salaried / contract employment types — holiday premium only applies when `employment_type = 'hourly'` (or has a `daily_rate`); for other types the holiday fields stay hidden.
- Changing existing NIS logic or any reports.
