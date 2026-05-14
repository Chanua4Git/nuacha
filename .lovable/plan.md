# Fix legacy payroll import (Jan 2020 – Apr 2022)

The current legacy CSV/sheet parser groups weeks by `weekStart`'s month. The source file has malformed rows (e.g. row 33 has Payment Date `21/4/2022` paired with Period Start `17/8/2020`), which causes weeks to land in the wrong month and inflates totals. NIS values are also being re-derived from the lookup table rather than trusted from the source, which is fine — but the per-week grouping must be correct first.

## Changes

### 1. Fix `parseLegacySheet` in `src/components/payroll/PayrollLogImporter.tsx`
- Group weeks by **`payDay`'s month** (the column most reliably tied to when the pay was issued), falling back to `weekStart` only when `payDay` is missing.
- Detect "corruption rows": if `payDay` and `weekStart` are more than ~60 days apart, **trust `weekStart`** and treat `payDay = weekEnd` (these are the rows where someone mistyped the year in the Payment Date cell).
- Skip rows where neither date is parseable.
- Continue to derive `recorded_pay = calculatedPay - nisEmployee` (matches the rule we set for monthly imports).

### 2. Re-import flow (user-driven, no auto-run)
The user clicks **Clear previous import** for the affected employee, then re-imports the workbook. The fixed parser will:
- Place Jan 2020 = 3 weeks ($2,800 gross)
- Place Feb 2020 = 4 weeks ($3,800 gross)
- Re-derive period totals from the corrected weekly rows

### 3. No schema changes
This is parser logic only. No migration needed. The existing `recorded_pay` / `net_pay` / period-totals derivation already in the importer handles the rest.

## Verification after re-import
Query the two months and confirm:
- January 2020: 3 weeks, gross $2,800, weeks dated 13–17 Jan, 21–24 Jan, 27–31 Jan
- February 2020: 4 weeks, gross $3,800, weeks dated 3–7, 10–14, 17–21, 25–28 Feb
- No weeks with `week_end_date` in a different month from `week_start_date`

## Out of scope
- Fixing the source spreadsheet itself (rows with mistyped Payment Date years remain in the file; the parser just routes them correctly).
- Touching the non-legacy monthly-sheet parser (already correct).
