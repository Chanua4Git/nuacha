

## Fix Weekly Calculator NIS Values — Use 2026 Database Rates

### The Problem

The weekly calculator shows old NIS values ($53.20/$106.40 for 4 days, $61.40/$122.80 for 5 days) because `payrollCalculations.ts` has **hardcoded lookup tables** that bypass the database entirely:

```
// OLD hardcoded values (lines 44-62)
if (daysWorked === 4) return 53.2;  // should be 65.30
if (daysWorked === 5) return 61.4;  // should be 75.30
```

The database migration updated the `nis_earnings_classes` table correctly, but the client-side `calculatePayroll` function never queries it.

### The Fix

**Replace hardcoded NIS lookups with database-driven class matching.** The approach:

1. **Fetch NIS classes from database on component mount** — query `nis_earnings_classes` where `is_active = true`, cache in state
2. **Update `calculateNISEmployeeByDays` and `calculateNISEmployerByDays`** — instead of hardcoded IFS values, calculate weekly earnings (daily_rate × days_worked), find the matching class from the fetched data, and return the class's contribution amounts
3. **Update `CURRENT_TT_NIS_RATES`** — remove the old percentage-based constant since the 2026 system uses fixed contribution amounts per class, not percentages
4. **Modify `calculatePayroll`** to accept an optional NIS classes array parameter, so the weekly calculator can pass the fetched classes

### Steps

1. **Add a hook or utility to fetch NIS classes** from Supabase (`nis_earnings_classes` table, `is_active = true`)
2. **Rewrite `calculateNISEmployeeByDays` and `calculateNISEmployerByDays`** to accept daily_rate + days_worked + NIS classes array, compute weekly earnings, find matching class, return fixed contribution amounts
3. **Update `calculatePayroll`** signature to accept NIS classes instead of the old percentage-based rates
4. **Update `EnhancedPayrollCalculator.tsx`** to fetch NIS classes on mount and pass them to calculations
5. **Update `useSupabasePayroll.ts`, `useSimplePayroll.ts`, `useSupabasePayrollDemo.ts`** to fetch and use database classes
6. **Remove or deprecate `CURRENT_TT_NIS_RATES`** constant

### Expected Result

For Angela at $280/day:
- 4 days ($1,120/week) → Class VII: Employee **$65.30**, Employer **$130.60**, Total **$195.90**
- 5 days ($1,400/week) → Class VIII: Employee **$75.30**, Employer **$150.60**, Total **$225.90**

Matching your spreadsheet exactly.

