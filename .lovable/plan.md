## Add "Method" column (Cash / Bank Transfer) to the Payroll Log PDF export

The PDF export already exists in `src/components/payroll/PayrollLog.tsx` (the print/PDF flow shown in your screenshot). This adds one more column — **Method** — filled in automatically based on pay date.

### Rule
- **Cash** — pay date on or before **Fri 24 Apr 2026**
- **Bank Transfer** — pay date on or after **Fri 1 May 2026**

Applied to every employee's export (same T&T-wide switchover date). Purely a display/PDF concern — no schema change, no per-row editing.

### Where
- `src/components/payroll/PayrollLog.tsx` — the HTML string builder used by the "Export PDF" button:
  - Add `<th>Method</th>` after "Paid On" in every monthly table header.
  - Add a `<td>` per row computed from `pay_date` (fallback to `week_end_date` if missing): `payDate <= '2026-04-24' ? 'Cash' : 'Bank Transfer'`.
  - Extend the month subtotal row's `colspan` by 1 so alignment stays correct.
  - Same column added to the on-screen Weekly view table so what you see matches what prints.

### Not in scope
- No changes to Monthly view, CSV export, database, or the calculator.
- No manual override toggle (can be added later if a specific week needs correcting).