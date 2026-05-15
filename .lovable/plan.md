## Goal
Under each month's **Subtotal** row in the Payroll Log (Weekly view), show an NI184-style breakdown line for the employee:

```
NationalInsurance | Surname | FirstName | DateOfBirth | DateEmployed | SalaryForPeriod | Week1 | Week2 | Week3 | Week4 | Week5
153848            | NEWTON  | ANGELA    | 1981-05-10  | 2020-04-30   | $5,040.00       | 195.9 | 195.9 | 195.9 | 195.9 | 0
```

## Rules
- **Week windows** = Mondays falling inside the calendar month (Mon→Sun). Months with 4 Mondays → 4 weeks + a 5th column showing `0`. Months with 5 Mondays → 5 weeks.
- **Each WeekN value** = total NIS for that week (employee + employer contribution), looked up from the active NIS earnings-class table using the week's earnings derived from days/hours actually logged. Weeks with no logged work show `0`.
- **SalaryForPeriod** = sum of the gross weekly earnings used for the lookup across the 4–5 windows in that month (not the recorded pay).
- **Rate table selection (effective date)**:
  - Period start year ≥ 2026 → use the **2026 contributions** rates.
  - Period start year < 2026 → use the **2016 contributions** rates.
  - Implementation: pass `effective_date` as the first day of the month being summarized to the existing `payroll-api → calculate-nis` action; database returns the most recent class set with `effective_date <= target`. Confirm a 2016-effective row set exists in `nis_earnings_classes`; if not, seed it (separate confirmation if missing).

## Where it appears
- `src/components/payroll/PayrollLog.tsx` — `WeeklyView` component. Add a second sub-row directly below the existing `Subtotal` row inside each month card. Same look (muted background, slightly smaller text), labeled `NI 184 breakdown` on the left, then the 6 fields + 5 week columns.
- Also append the same breakdown line to the **PDF export** (`handleExportPDF`) under each month's `Month total` row, matching the on-screen layout.
- CSV export unchanged for now.

## How the values are computed
1. Reuse `getWeekWindowsForMonth(year, month)` from `src/utils/ni184CsvExport.ts` to produce the Mon→Sun windows.
2. For each window, sum `days_worked` / `hours_worked` from the entries whose `week_start_date` falls inside the window.
3. Compute weekly earnings via the existing `computeWeeklyEarnings` helper (already in `ni184CsvExport.ts`).
4. Call `payroll-api` `calculate-nis` with `weekly_earnings` and `effective_date = first day of that month`.
5. `WeekN = round(employee_contribution + employer_contribution, 2)`. Pad to 5 columns with `0`.
6. `SalaryForPeriod = sum(gross_pay returned)` across the windows.

Use a lightweight in-memory cache keyed by `weekly_earnings|effective_date` so re-renders don't refetch.

## Technical details
- New hook `useNi184MonthlyBreakdown(employee, monthGroups)` in `src/hooks/` that returns a `Map<monthKey, Ni184Row>` and loading state. It reuses `buildNi184Rows` against the single employee + that month's entries + that month's windows + the chosen effective date.
- `WeeklyView` accepts the breakdown map and renders the extra row.
- Effective date helper: `const eff = group.entries[0]?.week_start_date?.slice(0,4) >= '2026' ? \`${year}-${month}-01\` : \`${year}-${month}-01\`` — same first-of-month string is fine because the DB resolves to the latest class on/before that date; the 2016 table covers pre-2026 automatically.

## Out of scope
- Editing the NI184 CSV export dialog (already correct).
- Schema changes — only depends on existing `nis_earnings_classes` rows. If the 2016 rate set is missing in the DB, I will surface that and propose a seed migration in a follow-up.

## Acceptance check (April 2026, Angela)
- 4 Mondays in April 2026 → 4 weeks + Week5 = 0.
- 4 weeks at 5 days × $35/hr × 8 = $1,400 weekly earnings → looks up 2026 class → ~$195.90 total NIS each week.
- SalaryForPeriod ≈ $5,600 (or $5,040 if one week has 4 days like the screenshot — driven by actual days logged).
- Row appears directly below the April 2026 subtotal in the Weekly view and in the PDF.
