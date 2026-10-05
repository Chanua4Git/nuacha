# Fix nurse shift wages so they show as expenses

## What's wrong now (checked)
- Only 2 of the 4 weekend wages are saved as expenses: Nikki Doe's Day shift on Sat 3 Oct (TT$300) and her Night shift on Sun 4 Oct (TT$250). **Missing:** Nikki's Day shift on Sun 4 Oct (TT$300) and Tricia Crawford's Night shift (TT$250).
- Nikki only has a "Weekend Day Shift" (TT$300) set up, so you can't pick a night shift for her.
- The Payroll Calculator shows TT$0 for shift workers, because it doesn't look at their shift rates. This is why Tricia's log line shows 5 days and TT$0 calculated, with TT$250 recorded.
- Lines saved in the Payroll Log or Calculator never become expenses. Only Quick Pay creates the "Wages" expense.

## What I'll do
1. **Add the missing wages** under The Peltier's: Nikki's Day shift on Sun 4 Oct (TT$300) and Tricia's Night shift (TT$250), each with the Day nurse or Night nurse category. Both get linked to Grandpa's TT$5,000 withdrawal, so Cash & Accounts adds up.
2. **Give Nikki a Night shift** at TT$250, next to her Weekend Day shift.
3. **Fix Tricia's log line** for the week of 28 Sep: 1 night shift, TT$250 calculated, NIS worked out the same way as other lines.
4. **Let shift workers be paid by the shift in the Calculator and Log:** pick the shift (Day or Night) and the number of shifts. The rate fills in from that shift, and the details panel shows each shift's rate instead of TT$0/month.
5. **Every saved wage becomes an expense automatically**, called "Wages – Name – Shift", under the selected household. Day shifts go to the Day nurse category and night shifts to Night nurse. If you save the same week again, the existing expense is updated, not duplicated. Deleting a log line removes its expense too.

## Please confirm
- Tricia's night shift date: Sat 3 Oct, unless you tell me otherwise.

## Technical details
- Data fixes: insert 2 `expenses` and their `money_allocations`, insert an `employee_shifts` row for Nikki's night shift, and update Tricia's `payroll_entries` row.
- Calculator details panel and rate: when the type is `shift_based`, use `employee_shifts`.
- Expense sync: after a `payroll_entries` save, upsert into `expenses`, keyed by `payroll_entry_id` (the column already exists). On delete, remove that expense. The category is found by name ("Day nurse" / "Night nurse") within the selected family.
