# Create demo employee: Suzette Paul

Duplicate the existing employee **A N-Collymore** (EMP001) so you have a fully-populated, anonymous demo employee for social media / screenshots.

## What gets created

**New employee row** (copy of Angela, with these changes):
- `first_name` = "Suzette"
- `last_name` = "Paul"
- `employee_number` = "EMP007" (next available)
- New `id` (generated)
- `national_id`, `nis_number`, `email`, `phone` cleared (so no real PII leaks)
- Everything else copied: `employment_type=hourly`, `hourly_rate=35.00`, `weekly_pay_schedule`, `date_hired`, etc.
- Same `user_id` (your account) so she shows up in your Payroll page

**All 274 payroll entries** copied:
- Same `payroll_period_id`, week dates, hours, gross/NIS/net pay, variance, notes
- New `employee_id` pointing to Suzette
- New `id` for each entry

**Shifts**: Angela has no `employee_shifts` rows, so nothing to copy there.

## How

A single insert script:

```text
1. INSERT INTO employees (... copy of Angela ...) RETURNING id  → :new_id
2. INSERT INTO payroll_entries
   SELECT  ... all columns except id and employee_id ...,
           gen_random_uuid(), :new_id
   FROM payroll_entries
   WHERE employee_id = 'f4b0e742-...-5dda560b3939';
```

No schema changes, no code changes. Reversible by deleting the new employee (payroll_entries will need manual cleanup since there's no FK cascade).

## Confirm before I run

1. OK to clear `national_id` / `nis_number` / `email` / `phone` on Suzette (recommended — keeps the demo truly anonymous)? Or do you want placeholder values like `NIS-DEMO-001`?
2. Copy all 274 payroll entries, or just the most recent month/period so the demo is lighter?
