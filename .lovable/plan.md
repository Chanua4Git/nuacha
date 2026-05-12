## Add "Employee Pay Less NIS Emp" column to Payroll Log

The Log already shows **Calc Pay**, **NIS Emp.**, and **Recorded** for each week. You're asking for a new derived column that always shows **Calc Pay − NIS Emp** (e.g., $840.00 − $45.60 = **$794.40**), independent of whatever was entered into Recorded Pay.

### Scope (frontend only — `src/components/payroll/PayrollLog.tsx`)

1. **Weekly view table** — add column **"Pay less NIS Emp"** between `NIS Emp.` and `Recorded`, value = `gross_pay - nis_employee_contribution`. Add matching subtotal cell using `totals.calculated - totals.nisEmployee`.
2. **Monthly table (collapsed row)** — add a **"Pay less NIS Emp"** column with the same derivation on monthly totals.
3. **Monthly expanded drill-down** — add the same per-week column.
4. **CSV export** — already includes `Calc Pay less NIS`; leave as-is.
5. **Print/HTML export** — add the column to the printed weekly table and totals row to match the on-screen view.
6. **Summary chips** at the top — add a **"Pay less NIS"** chip = `grandTotals.calculated - grandTotals.nisEmp`.

### What I will NOT change

- **Recorded Pay** stays as the entered value (its purpose is to capture what was actually paid, which is why Week 2 shows 0). The new column gives you the "what should have been paid net of employee NIS" reference next to it so the discrepancy is obvious.
- No DB changes, no recompute migration — purely a derived display column.

### Verification

Refresh `/payroll` → Log → expand May 2026: Week 1 and Week 2 should each show **$794.40** in the new column, regardless of Recorded.

### Note on your follow-up

If you'd rather have **Recorded auto-fill** with `Calc Pay − NIS Emp` whenever it's left blank/zero (instead of just adding a separate column), say the word and I'll add that behavior to the calculator save path as a second step.