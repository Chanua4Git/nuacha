

## Enhance Payroll to Support NI 184 and NI 187 Form Generation

### What the forms require (gap analysis)

**NI 184 (Statement of Contribution Paid/Due)** -- per-employee detail form:
- Employer trade name, registration number, service centre code, address, telephone
- Contribution period (from/to dates), number of weeks in period
- Per employee row: NIS number, surname + first name, date of birth, date employed/last date worked, salary for period, weekly contribution values (WK1-WK5), total contributions b/f

**NI 187 (Summary of Contributions Due)** -- employer summary form:
- Same employer header info
- Pay period from/to
- Number of employees
- Contributions due total, penalty, interest, balance b/f, amount paid, balance c/f
- Payment method (cash/cheque)
- Section F for multi-month breakdowns

### What Nuacha already has
- Employee: first_name, last_name, nis_number, national_id, date_hired, employment type, rates
- Weekly calculator: days worked, NIS employee/employer contributions per week, calculated pay
- Period summaries: total gross, NIS employee, NIS employer, net pay
- Saved payroll periods with status tracking

### What is missing

**Employee table** -- needs:
- `date_of_birth` (DATE) -- required on NI 184
- `last_date_worked` (DATE) -- optional, for terminated employees

**Employer profile** -- entirely missing. Need a new `employer_settings` table:
- `trade_name` (TEXT) -- employer's business/trade name
- `employer_reg_no` (TEXT) -- 5-digit NIS employer registration number
- `service_centre_code` (TEXT) -- NIS service centre code
- `address` (TEXT)
- `telephone` (TEXT)

**Payroll period data** -- the weekly NIS contribution values per employee are calculated but not individually persisted in a way that maps to NI 184 columns (WK1 $, WK2 $, etc.). They exist in the `payroll_data` JSON blob but need to be extractable per-employee.

**NI 187 fields** -- need:
- `balance_bf` (brought forward from prior period)
- `penalty` and `interest` (if applicable)
- Payment method tracking

### Plan

**1. Database migration: Add missing fields**
- Add `date_of_birth` column to `employees` table
- Create `employer_settings` table (user_id, trade_name, employer_reg_no, service_centre_code, address, telephone)
- Add `balance_bf`, `penalty`, `interest`, `payment_method` columns to `payroll_periods` table (for NI 187)

**2. Update Employee Form**
- Add date of birth field to `EmployeeForm.tsx`
- Update `EmployeeFormData` type in `types/payroll.ts`

**3. Create Employer Settings UI**
- New component `EmployerSettingsForm.tsx` on the payroll page (likely under a new "Settings" or within the "About" tab)
- Fields: trade name, employer registration number, service centre code, address, telephone
- Save/load from `employer_settings` table

**4. Build NI 184 report generator**
- New component `NI184Report.tsx`
- Takes a saved payroll period + employee data
- Renders a printable/exportable form matching the NI 184 layout:
  - Header with employer info from `employer_settings`
  - Period from/to, weeks count
  - Table rows: one per employee with NIS number, name, DOB, date employed, salary for period, weekly contribution values (from the weekly calculator data), total
- Export as PDF or print-friendly view

**5. Build NI 187 report generator**
- New component `NI187Report.tsx`
- Summary form with employer info, period, employee count
- Section B: balance b/f, contributions due (sum of all employee+employer NIS), penalty, interest, total, amount paid, balance c/f
- Section F for multi-month periods
- Export as PDF or print-friendly view

**6. Add "Generate NIS Forms" button to Summary & Export tab**
- Two buttons: "Generate NI 184" and "Generate NI 187"
- Pre-fill from saved period data + employer settings
- Allow user to enter balance b/f, penalty, interest before generating NI 187

**7. Update Supabase types**
- Regenerate or manually update `integrations/supabase/types.ts` for new columns/tables

### For the Feb 01-28 2026 period example
With the employee A N-Collymore at $280/day, 5 weeks, 19 total days worked:
- Gross: $5,320 | NIS Employee: $237.40 | NIS Employer: $474.80 | Net: $5,082.60
- NI 184 would show weekly breakdown: each week's contribution value in WK1-WK5 columns
- NI 187 would show total contributions due: $237.40 + $474.80 = $712.20

### Technical details
- Migration adds columns with sensible defaults (nullable for backward compatibility)
- Employer settings is a single-row-per-user table with RLS
- NI 184/187 reports use CSS `@media print` for clean printing
- No changes to the payroll-api edge function needed -- this is presentation/data capture work

