## Add delete row to Payroll Log

Add a trash icon to each weekly entry row in the Payroll Log. Clicking it opens a confirmation dialog ("Delete this week's entry? This cannot be undone.") showing the week start/end and amount. On confirm, delete the `payroll_entries` row in Supabase, refresh the log, and recompute the period totals so the subtotal stays accurate.

### Where
- `src/components/payroll/PayrollLog.tsx` — add a Delete button (Trash icon) in the actions column of each row, plus an AlertDialog for confirmation.
- `src/hooks/useEmployeePayrollHistory.ts` — add a `deleteEntry(entryId)` mutation that deletes from `payroll_entries`, then recomputes the parent period's totals (gross/NIS emp/NIS empr/net) from remaining entries, and invalidates the history query.

### Behavior
- Only deletes the single row clicked (e.g. the duplicate zero rows or the empty 05-11 row).
- Uses shadcn AlertDialog so it's a clear confirm/cancel.
- Toast on success/error.
- Subtotal and NI 184 monthly breakdown refresh automatically since they derive from the same data.
