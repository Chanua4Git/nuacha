## Fix Recorded Pay for imported May 2026 (and all xlsx imports)

### What's happening

In the database, May 2026 has 4 weeks. The importer pulled `recorded_pay` from the spreadsheet column 14 even when no work happened:

| Week | Days | Calc Pay | NIS Emp | Recorded (now) | Should be |
|------|------|----------|---------|----------------|-----------|
| 1 (May 4–10) | 3 | 840.00 | 45.60 | **1066.80** | **794.40** |
| 2 (May 11–17) | 0 | 0.00 | 0.00 | **1338.60** | **0** (not yet paid) |
| 3 (May 18–24) | 0 | 0.00 | 0.00 | **1066.80** | **0** |
| 4 (May 25–31) | 0 | 0.00 | 0.00 | **1338.60** | **0** |

The 1066.80 / 1338.60 values are template/default cells from the spreadsheet, not actual amounts paid. The **calculator UI** correctly shows 794.40 for Week 1 because that's `Calc Pay − NIS Emp`.

### Fix (two parts)

**1. Data migration — clean up existing imported rows**

Scope: `payroll_entries` whose period has `import_source LIKE 'xlsx_import_%'` and `user_id = auth.uid()`.

- Where `gross_pay = 0` (no work done): set `recorded_pay = 0`, `variance_amount = 0`, `net_pay = 0`.
- Where `gross_pay > 0`: set `recorded_pay = gross_pay − nis_employee_contribution`, `variance_amount = 0`, `net_pay = gross_pay − nis_employee_contribution − COALESCE(other_deductions,0)`.
- Recompute affected `payroll_periods.total_net_pay` from the entries (`total_gross_pay`, `total_nis_*` already correct from prior migration).

**2. Importer fix — `src/components/payroll/PayrollLogImporter.tsx`**

Stop sourcing `recorded_pay` from the spreadsheet's column 14. Instead derive it from work actually done:

```ts
const derivedRecorded = w.calculatedPay > 0 ? w.calculatedPay - w.nisEmployee : 0;
recorded_pay: derivedRecorded,
variance_amount: 0,
net_pay: derivedRecorded,
```

Also drop `recordedPay` from `ParsedWeek` (or keep as informational only).

### Why this is correct

- "Recorded Pay" = what the employee actually received in hand = `Calc Pay − NIS Emp`. The variance column already exists for cases where that needs manual override later (you can still edit recorded from the calculator).
- Weeks with zero days worked have nothing to record — leaving 1338.60 there inflates the monthly Recorded total and is misleading for May (a month not yet finished).

### Verification

After applying:
- Refresh `/payroll` → Log → expand May 2026.
- Week 1 Recorded shows **$794.40** (matches "Pay less NIS Emp" column and the Calculator screenshot).
- Weeks 2–4 Recorded show **$0.00**.
- Monthly subtotal Recorded = **$794.40** for May 2026.
- Grand total "Recorded" chip drops by the inflated amounts across all imported months that had blank weeks.

### Out of scope

- No change to the manual Calculator's recorded-pay field (still user-editable per week).
- No change to NIS values (already corrected by previous migration).