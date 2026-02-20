

## Fix: Saved Payroll Periods Showing $0.00 for All Financial Data

### Problem
When saving a payroll period, the financial totals (`total_gross_pay`, `total_nis_employee`, `total_nis_employer`, `total_net_pay`) are never written to the database columns. The actual calculation data is stored inside the `payroll_data` JSON field, but the summary columns remain at their default of 0. The Saved Periods list and detail dialog both read from these empty columns, showing $0.00 everywhere.

### Root Cause
In `EnhancedPayrollCalculator.tsx`, the `handleSavePayrollPeriod` function calls `savePayrollPeriod()` without passing the totals from `getTotalSummary()`.

### Solution

**File: `src/components/payroll/EnhancedPayrollCalculator.tsx`** (lines ~408-418)

Update `handleSavePayrollPeriod` to include the calculated totals when saving:

```typescript
await savePayrollPeriod({
  name: payrollPeriod.periodName,
  start_date: payrollPeriod.startDate.toISOString().split('T')[0],
  end_date: payrollPeriod.endDate.toISOString().split('T')[0],
  pay_date: payrollPeriod.weeks[payrollPeriod.weeks.length - 1]?.payDay.toISOString().split('T')[0] || '',
  payroll_data: payrollData,
  notes: saveFormData.notes,
  transaction_id: saveFormData.transactionId,
  entered_date: saveFormData.enteredDate,
  status: saveFormData.status,
  // NEW: Persist financial totals to dedicated columns
  total_gross_pay: totals.totalCalculatedPay,
  total_nis_employee: totals.totalNISEmployee,
  total_nis_employer: totals.totalNISEmployer,
  total_net_pay: totals.totalNetPay,
});
```

**File: `src/hooks/useEnhancedPayroll.ts`** (savePayrollPeriod function)

Update the `periodData` type to accept the new total fields:

```typescript
const savePayrollPeriod = async (
  periodData: {
    name: string;
    start_date: string;
    end_date: string;
    pay_date: string;
    payroll_data: any;
    notes?: string;
    transaction_id?: string;
    entered_date?: string;
    status?: 'draft' | 'calculated' | 'processed' | 'paid';
    total_gross_pay?: number;
    total_nis_employee?: number;
    total_nis_employer?: number;
    total_net_pay?: number;
  }
)
```

**File: `src/components/payroll/PayrollPeriodManager.tsx`**

Add a fallback so existing saved periods (with $0 in the columns) can still show correct data by reading from `payroll_data.totals`:

- In the view dialog and table, if `total_net_pay` is 0 but `payroll_data?.totals` exists, use the JSON totals as a fallback
- This ensures previously saved periods display correctly without re-saving

### Technical Details
- Two files modified: `EnhancedPayrollCalculator.tsx` and `useEnhancedPayroll.ts`
- One file enhanced with fallback: `PayrollPeriodManager.tsx`
- No database schema changes needed -- columns already exist
- Previously saved periods will show correct data via the JSON fallback

