

## Fix: NIS Calculating 4-Day Weeks as 5-Day Weeks

### Root Cause

Angela is stored as an **hourly** employee ($35/hr, no `daily_rate` in the database). The Enhanced Payroll Calculator correctly computes her 8-hour daily rate as $280 (`35 × 8`) for display, but when it calls `calculatePayroll`, it passes `daily_rate: undefined` (from the DB record).

Inside `calculatePayroll`, the NIS lookup code has this logic:
```
if (input.days_worked !== undefined && employee.daily_rate) {
    weeklyEarnings = employee.daily_rate * input.days_worked;
}
```

Since `employee.daily_rate` is `undefined`, this override **never triggers**. Instead, it uses `calculateWeeklyWage()` which for hourly employees always returns `hourlyRate × 40 = $1,400` -- a full 5-day week regardless of actual days worked.

Result: 4 days and 5 days both map to Class VIII ($75.30 / $150.60) instead of 4 days mapping to Class VII ($65.30 / $130.60).

### The Fix

**In `EnhancedPayrollCalculator.tsx`, line ~307-312**: When building `employeeData` for the calculation, set `daily_rate` to the already-computed `dailyRate8Hr` from the week data. This ensures hourly employees who are tracked by days get the correct weekly earnings for NIS lookup.

```typescript
const employeeData: EmployeeData = {
  employment_type: selectedEmployee.employment_type,
  hourly_rate: selectedEmployee.hourly_rate,
  monthly_salary: selectedEmployee.monthly_salary,
  daily_rate: selectedEmployee.daily_rate || week.dailyRate8Hr, // Use computed daily rate as fallback
};
```

This single change ensures:
- **4 days**: `280 × 4 = $1,120` → Class VII → Employee $65.30 / Employer $130.60
- **5 days**: `280 × 5 = $1,400` → Class VIII → Employee $75.30 / Employer $150.60

No other files need changes -- the calculation utility already handles `daily_rate × days_worked` correctly when `daily_rate` is provided.

