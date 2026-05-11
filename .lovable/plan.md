## Goal
Back-fill the missing **NIS Emp.**, **NIS Empr.**, and **Total NIS** values on imported Payroll Log rows by applying the **September 5, 2016 NIS earnings classes (13.2% rate)** schedule — the older table in your screenshot — to every row dated **before January 5, 2026** (when the new 16.2% schedule kicks in).

## Why
The DB only contains the 2024 and 2026 schedules. The 2016 schedule was never loaded, so any historical row whose import didn't carry an NIS value (most of them) ended up with `0/0`. Adding the 2016 schedule and back-filling fixes both the displayed rows and the month totals.

## Steps

### 1. Load the September 5, 2016 NIS schedule into `nis_earnings_classes`
Insert all 16 classes with `effective_date = 2016-09-05`. Values taken from your uploaded image (13.2% schedule):

```text
Class  Weekly Earnings      Employee  Employer  Total
I      200.00 - 339.99       11.90     23.80    35.70
II     340.00 - 449.99       17.40     34.80    52.20
III    450.00 - 609.99       23.30     46.60    69.90
IV     610.00 - 759.99       30.10     60.20    90.30
V      760.00 - 929.99       37.20     74.40   111.60
VI     930.00 - 1119.99      45.10     90.20   135.30
VII    1120.00 - 1299.99     53.20    106.40   159.60
VIII   1300.00 - 1489.99     61.40    122.80   184.20
IX     1490.00 - 1709.99     70.40    140.80   211.20
X      1710.00 - 1909.99     79.60    159.20   238.80
XI     1910.00 - 2139.99     89.10    178.20   267.30
XII    2140.00 - 2379.99     99.40    198.20   298.20  (XII–XVI bottom of image — will read off the image to confirm exact cents before insert)
XIII   2380.00 - 2629.99    110.20    220.40   330.60
XIV    2630.00 - 2919.99    (read from image)
XV     2920.00 - 3137.99    (read from image)
XVI    3138.00 - 99999.99   (read from image)
```

The lookup function `get_nis_earnings_classes(target_date)` already picks the most recent schedule on or before a given date, so once these rows exist:
- Any date `< 2024-01-01` → uses **2016** schedule
- `2024-01-01` to `2026-01-04` → uses **2024** schedule (already loaded)
- `≥ 2026-01-05` → uses **2026** schedule (already loaded)

### 2. Back-fill imported payroll entries with NIS = 0
Single SQL pass, scoped to **your** imported xlsx data only:
- Join `payroll_entries` → `payroll_periods`
- Filter: `pp.user_id = auth.uid()` AND `pp.import_source LIKE 'xlsx_import_%'` AND `pp.start_date < '2026-01-05'` AND `pe.nis_employee_contribution = 0` AND `pe.nis_employer_contribution = 0`
- For each match, look up the bracket using `gross_pay` against the schedule active on `pp.start_date` (the 2016 table for pre-2024, 2024 table for 2024–2025)
- Update `nis_employee_contribution`, `nis_employer_contribution`, and recompute `net_pay = gross_pay - nis_employee_contribution - other_deductions`

Rows with `gross_pay < 200` (below Class I floor) stay at `0/0`.

### 3. Recompute period totals
After entries update, recompute each affected `payroll_periods` row:
- `total_nis_employee` = SUM(entries.nis_employee_contribution)
- `total_nis_employer` = SUM(entries.nis_employer_contribution)
- `total_net_pay` = SUM(entries.net_pay)

### 4. Verify in the UI
Refresh `/payroll` → Payroll Log → expand any 2015 / 2018 / 2022 / 2025 month → confirm NIS Emp., NIS Empr., and Total NIS columns are filled and month totals match the sum of the rows.

## Technical details

### Files / changes
- **One migration**: insert the 16 rows into `nis_earnings_classes` for `2016-09-05`, then run the back-fill `UPDATE` and the period-totals recompute in the same transaction.
- **No frontend code changes** — `useNISLookup` / `nisLookupCalculations.ts` already resolve the right schedule per date. Future imports will automatically use the 2016 schedule for pre-2024 rows now that it exists.

### Assumptions
- The 13.2% September 5, 2016 schedule is the canonical historical schedule for **everything dated before 2024**, including 2014–2015 rows (no earlier schedule will be loaded).
- "Total NIS" in the log UI is computed as `nis_employee + nis_employer`, so back-filling the two component columns automatically corrects Total.
- Use `gross_pay` (recorded weekly pay) as the weekly-earnings input for the class lookup. Rows with `gross_pay = 0` stay `0/0`.
- Do not overwrite any row that already has a non-zero NIS value (preserves any actual recorded values).