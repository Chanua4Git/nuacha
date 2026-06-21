# Payslip + WhatsApp share

Add a one-tap payslip generator on the Payroll Log so you can send Angela her Week 3 (or any saved week) via WhatsApp Web/app — no API, just a `wa.me` link with a pre-formatted message.

## Where it lives

**Payroll Log row → new "Payslip" button** (next to existing row actions). Opens a `PayslipDialog`.

The dialog shows:
- Employee name + period (auto-filled from the row)
- Phone number field (pre-filled from `employees.phone` if saved; editable; "Save to employee" checkbox)
- Live payslip preview (formatted text, ready to send)
- Three buttons:
  - **Send via WhatsApp** → opens `https://wa.me/<phone>?text=<encoded payslip>` in new tab (works with WhatsApp Web on desktop, WhatsApp app on mobile)
  - **Copy text**
  - **Close**

## Payslip format (plain text, WhatsApp-friendly)

```
🧾 Payslip — Angela
Period: Jun 15–21, 2026 (Week 3)

Regular days: 4 × $250 = $1,000.00
Holiday days: 1 × $250 × 1.5 = $375.00
─────────────
Gross pay: $1,375.00
NIS (employee): -$57.40
─────────────
Net pay: $1,317.60

Paid by Nuacha Payroll
```

Holiday line only shows if `holiday_days > 0`. Pulled straight from the saved `payroll_entries` row (no recalculation).

## Longer-period payslips

Also add a **"Payslip"** action at the **period level** (above the weeks list) that lets you select a date range / multiple weeks and generates a combined payslip — same dialog, same WhatsApp flow, just with each week itemised and a grand total.

## Phone handling

- Stored on `employees.phone` (already exists in schema, already on EmployeeForm).
- Dialog accepts any format; strip non-digits before building the `wa.me` URL.
- If no country code, prepend T&T's `+1868` automatically (with a small "Edit country code" link for non-TT numbers).

## Week 1 missing

Separate issue from this feature. After you approve the plan I'll check `payroll_entries` for Angela in June to see whether Week 1 was never saved vs. saved-but-not-displayed, and report back before changing anything.

## Technical details

- **New component**: `src/components/payroll/PayslipDialog.tsx` — takes `{ employee, entries[], periodLabel }`.
- **New util**: `src/lib/payslip.ts` — `formatPayslipText(entry|entries, employee)` and `buildWhatsAppUrl(phone, text)`.
- **PayrollLog.tsx**: add per-row "Payslip" button → opens dialog with that single entry.
- **PayrollPeriodManager.tsx** (or wherever the period header lives): add "Payslip (custom range)" button with a small week-picker → opens dialog with multiple entries.
- **EmployeeForm**: no change (phone already there). Dialog's "Save to employee" just updates `employees.phone` via existing update path.
- No DB migration. No edge function. No new dependencies.

## Out of scope
- PDF payslips (text-only for now; can add later if you want).
- Email delivery.
- WhatsApp Business API.
- Fixing the missing Week 1 (will investigate separately).
