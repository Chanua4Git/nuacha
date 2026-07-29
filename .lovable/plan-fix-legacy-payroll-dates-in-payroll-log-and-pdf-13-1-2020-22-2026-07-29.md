# Fix legacy payroll dates in Payroll Log and PDF (13/1/2020 – 22/4/2022)

## What's actually wrong

Checked the stored rows for A N-Collymore in Jan–Apr 2020 against your spreadsheet:

1. **Pay Day is wrong on every legacy row in both places.** The spreadsheet has a payment date per week (17/1, 24/1, 31/1, 7/2 …). The importer throws that value away and stores a single pay date on the *month* record — so the visible Payroll Log table and the PDF both print the same month-end date (2020-01-31, 2020-02-29 …) on every row of that month.
2. **A few week start/end pairs are shifted by a day.** Examples: stored 2020-02-11 → 02-15 where the sheet says 10/2 → 14/2; stored 2020-03-08 → 03-12 where the sheet says 9/3 → 13/3; stored 2020-04-05 → 04-09 where the sheet says 6/4 → 10/4. These came from the earlier repair pass that rebuilt week ends from a corrupted week start.

The amounts, days and NIS values match the sheet — this is purely a date problem.

## The fix

**1. Store the real payment date per week**
- Add a `pay_day_date` column to payroll entries.
- Importer writes column A (Payment Date) from the sheet into it, column B into week start, column C into week end — no clamping or re-derivation for legacy sheets, the sheet is the authority.
- Payroll Log weekly table, PDF export and CSV export read `pay_day_date` first and only fall back to the period pay date for older rows that don't have it.

**2. Re-import the legacy tab to correct the shifted weeks**
Rather than guessing corrections row by row, the "Jan 2020-April 2022" tab gets re-imported with the corrected parser. The import replaces the existing entries for each week it covers for A N-Collymore and any other employee rows in that same affected historical import range (matched on employee + week start), so no duplicates. Manually entered values on 2026 rows are untouched.

Because a few stored week starts are off by a day, matching also clears any legacy row inside the re-imported date range that the sheet doesn't account for, so no orphaned duplicates remain.

**3. Recompute month totals** for every affected month after the re-import.

## What you'll need to do

Re-upload `Angela Salary Study.xlsx` through the existing importer once the changes are in — that's what rewrites the dates for every affected month from 13/1/2020 through 22/4/2022. I'll tell you exactly where to click.

## Technical notes

- Migration: `ALTER TABLE payroll_entries ADD COLUMN pay_day_date date`.
- `parseLegacySheet` in `PayrollLogImporter.tsx`: drop the weekEnd/payDay clamping for the legacy layout; parse all three columns as DD/MM/YYYY (with Excel serial support), and only fall back to derived values when a cell is genuinely empty.
- `PayrollLog.tsx`: `e.pay_day_date || e.pay_date` in the visible weekly table, `generatePDF` and `handleExportCSV`; grouping keeps using week start.
- `useEmployeePayrollHistory.ts`: select and map the new field.
