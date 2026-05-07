## NI 184 Monthly CSV Export

Auto-generate the NIBTT NI 184 contribution CSV for any selected month, with weekly NIS values calculated from each employee's actual days/hours worked that week.

### CSV format (matches your samples)

```text
NationalInsuranceNumber,Surname,FirstName,DateOfBirth,DateEmployed,SalaryForPeriod,Week1,Week2,Week3,Week4,Week5
```

- `DateOfBirth`, `DateEmployed`: `YYYYMMDD`
- `SalaryForPeriod`: total gross pay for the month
- `WeekN`: **employee + employer NIS** for that week (e.g., $135 = $45 + $90 for Class VII)
- Unused weeks (4-week months) → `0`
- Filename: `NI184_{Month}_{Year}_NIS_Contribution_Calculations.csv`

### Determining 4 vs 5 weeks

Count **Mondays in the calendar month**. 4 Mondays → 4 weeks (Week5 = 0). 5 Mondays → 5 weeks. Each "Week N" corresponds to the Mon–Sun window starting on the Nth Monday of that month.

### Weekly NIS calculation (per employee, per week)

For each week window in the month:
1. Aggregate that employee's actual `days_worked` / `hours_worked` from `payroll_entries` whose `week_start_date` falls inside the window (across all payroll periods touching the month).
2. Compute weekly earnings:
   - Hourly: `hourly_rate × hours_worked` (fallback `hourly_rate × 8 × days_worked`)
   - Daily: `daily_rate × days_worked`
   - Salaried/weekly-rate: prorated weekly rate
3. Look up NIS class via existing `payroll-api` (`calculate-nis`) → sum `employee_contribution + employer_contribution`.
4. If no entries in that week → `0`.

`SalaryForPeriod` = sum of gross pay across all weeks in the month.

### UI

On `src/pages/Payroll.tsx`, add an **"Export NI 184 CSV"** button that opens a small dialog:
- Month + Year picker (defaults to current month)
- "Download CSV" action → triggers calculation + browser download

### New files / changes

- `src/utils/ni184CsvExport.ts` — pure functions:
  - `getWeekWindowsForMonth(year, month)` → array of {start, end} starting on each Monday
  - `buildNi184Rows(employees, payrollEntries, weekWindows)` → uses `payroll-api` for NIS lookups
  - `rowsToCsv(rows)` + `downloadCsv(filename, csv)`
- `src/components/payroll/Ni184MonthlyExportDialog.tsx` — month picker + download button
- `src/pages/Payroll.tsx` — wire the button into the existing toolbar

No database or edge function changes required — `payroll-api / calculate-nis` already returns the per-week class and contributions we need.

### Validation

After implementation, verify against your sample:
- Angela, May 2026 (4 Mondays in some months / 5 in others) — confirm `135` per worked week and `0` for any unworked Week5.
