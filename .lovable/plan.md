# Payroll log reconciliation for A N-Collymore (2022 gap + month-by-month audit)

## What's actually going on with February 2023

February 2023 in the app is not wrong under the rule you chose. The workbook tabs are named by NIS *filing* month, so the tab called "Feb 2023" contains the weeks of 2 Jan – 30 Jan 2023 ($6,300 gross, $822.90 total NIS) — and the app already shows exactly those figures under **January 2023**. The app's **February 2023** ($4,760 / $638.70, weeks 6–27 Feb) matches the weeks in the tab labelled "March 2023".

Since you want to keep calendar-week grouping, no re-labelling happens. What does need fixing is that several workbook tabs are stale copies of another month (for example "Nov 2022" holds October's rows, "Jan 2024" holds January 2023's rows), so the earlier import let the wrong tab win for some weeks. That is where genuine differences can still exist.

## What will be done

### 1. Fill the May–September 2022 gap
Those months exist in your live workbook but not in the copy uploaded here. Import them from the screenshots you sent, once the August 2022 screenshot arrives:

- May 2022: weeks 2, 9, 16, 23, 30 May — 5 days each, $25/hr, $1,000 per week
- June 2022: weeks 6, 13, 20 Jun ($1,000 each) and 27 Jun ($1,040, $26/hr)
- July 2022: weeks 4, 11, 18, 25 Jul — $30/hr, $1,200 per week
- August 2022: pending your screenshot
- September 2022: weeks 5, 19, 26 Sep ($1,200) and 12 Sep ($960, 4 days)

Each week gets week start (Monday), week end (Sunday), the pay day from column C, days worked, calculated pay, recorded pay, and NIS from the 2016 schedule (employer = 2× employee), with monthly totals recalculated.

### 2. Month-by-month audit, June 2022 to date
Rebuild a single authoritative week table from the workbook using a strict precedence rule — a week is taken from the tab whose own month matches that week, and stale copies in mis-labelled tabs are ignored — then compare every week already in the database against it on: week start, week end, pay day, days worked, calculated pay, recorded pay, NIS employee, NIS employer.

Any week that differs is corrected in place; weeks present in the workbook but missing from the log are inserted; duplicated weeks are removed. Monthly totals and the NI 184 breakdown are refreshed for every touched month.

### 3. Reconciliation report
After the pass, a short summary of what changed per month (weeks added, corrected, removed) so you can spot-check against the spreadsheet.

## Technical notes

- Source of truth: `Angela_Salary_Study_1.xlsx` tabs plus the May/Jun/Jul/Sep 2022 screenshots (Aug 2022 pending).
- Week keys are Monday-anchored; tab-vs-week month matching resolves the duplicate-tab problem that caused earlier drift.
- Data corrections run as data updates against `payroll_entries` / `payroll_periods`; no schema change is required.
- Grouping convention stays as-is: a month contains the weeks whose Monday falls in that month.
- No UI changes.

## Waiting on

The **August 2022** tab screenshot (or a CSV of May–Sep 2022) before the import runs.
