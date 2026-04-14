

## Update NIS Rates to 2026 Compliance

### The Problem

Your database has **old 2024 NIS rates** (10 classes, max $1,500/week, effective 2024-01-01). The new rates effective **05 January 2026** have **16 classes (I-XVI)** with completely different brackets, a new contribution rate of **16.2%**, and a max bracket of $3,138+/week.

**Angela's impact**: At $280/day × 5 days = $1,400/week, she falls in:
- Old rates: Class 10 → Employee $19.80 / Employer $41.25 (wrong)
- **New 2026 rates: Class VII** ($1,120-$1,299.99) → **Employee $65.30 / Employer $130.60**

Your current payroll calculations are significantly under-reporting NIS contributions.

### What needs to change

**1. Database migration: Replace NIS earnings classes**
- Deactivate all old 2024 classes (`is_active = false`)
- Insert all 16 new 2026 classes with correct brackets and contribution amounts from the official NIBTT document:

| Class | Weekly Range | Employee $ | Employer $ |
|-------|-------------|-----------|-----------|
| I | 200-339.99 | 14.60 | 29.20 |
| II | 340-449.99 | 21.30 | 42.60 |
| III | 450-609.99 | 28.60 | 57.20 |
| IV | 610-759.99 | 37.00 | 74.00 |
| V | 760-929.99 | 45.60 | 91.20 |
| VI | 930-1119.99 | 55.40 | 110.80 |
| VII | 1120-1299.99 | 65.30 | 130.60 |
| VIII | 1300-1489.99 | 75.30 | 150.60 |
| IX | 1490-1709.99 | 86.40 | 172.80 |
| X | 1710-1909.99 | 97.70 | 195.40 |
| XI | 1910-2139.99 | 109.40 | 218.80 |
| XII | 2140-2379.99 | 122.00 | 244.00 |
| XIII | 2380-2629.99 | 135.30 | 270.60 |
| XIV | 2630-2919.99 | 149.90 | 299.80 |
| XV | 2920-3137.99 | 163.60 | 327.20 |
| XVI | 3138+ | 169.50 | 339.00 |

**2. Update edge function threshold**
- The `payroll-api` edge function has a hardcoded $200/week NIS threshold -- this stays correct (Class I starts at $200)
- The max bracket logic needs updating since the old code caps at Class 10

**3. Update class naming convention**
- Old: "Class 1" through "Class 10"
- New: Roman numerals "Class I" through "Class XVI" to match official NIBTT forms

**4. No UI changes needed**
- The calculators already pull rates from the database dynamically
- Once the data is updated, all calculations (Enhanced Payroll Calculator, NIS Calculator, NI 184/187 reports) will automatically use the correct 2026 rates

### Technical details
- Single SQL migration: deactivate old rows, insert 16 new rows with `effective_date = '2026-01-05'`
- Redeploy `payroll-api` edge function (minor: ensure Class XVI handles the "and over" case with a very high max like 99999.99)
- Historical periods calculated before this update retain their saved values -- only new calculations use updated rates

